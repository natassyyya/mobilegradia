import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Menangani CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('--- Supabase Edge Function: evaluate-deadlines ---');
    
    // Inisialisasi client Supabase dengan Service Role Key dari environment internal Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Tandai semua tugas yang sudah lewat deadline (dan belum Completed/Overdue) menjadi "Overdue"
    const { data: overdueUpdated, error: overdueError } = await supabase
      .from('task')
      .update({ status: 'Overdue' })
      .lt('deadline', now.toISOString())
      .neq('status', 'Completed')
      .neq('status', 'Overdue')
      .select('id_task, title, deadline');

    if (overdueError) {
      console.error('Error marking tasks as overdue:', overdueError);
    } else if (overdueUpdated && overdueUpdated.length > 0) {
      console.log(`Successfully marked ${overdueUpdated.length} tasks as Overdue:`, overdueUpdated.map(t => t.title));
    }

    // 2. Ambil semua tugas aktif (bukan Completed dan bukan Overdue) yang memiliki deadline
    const { data: tasks, error: tasksError } = await supabase
      .from('task')
      .select(`
        id_task, 
        title, 
        deadline, 
        status,
        course:id_course (
          id_courses,
          workspace:id_workspace (
            id_workspace,
            id_user
          )
        )
      `)
      .neq('status', 'Completed')
      .neq('status', 'Overdue')
      .not('deadline', 'is', null);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return new Response(JSON.stringify({ error: tasksError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }

    console.log(`Found ${tasks?.length || 0} active tasks to evaluate.`);

    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    const results = [];

    for (const task of tasks || []) {
      if (!task.deadline) continue;

      const deadlineTime = new Date(task.deadline).getTime();
      const remainingMs = deadlineTime - nowMs;
      const remainingHours = remainingMs / (1000 * 60 * 60);

      let targetTimeLeft: number | null = null;

      // Peraturan:
      // - Sisa waktu <= 24 jam dan > 1 jam -> time_left = 24
      // - Sisa waktu <= 1 jam dan > 0 jam -> time_left = 1
      if (remainingHours <= 24 && remainingHours > 1) {
        targetTimeLeft = 24;
      } else if (remainingHours <= 1 && remainingHours > 0) {
        targetTimeLeft = 1;
      }

      if (targetTimeLeft === null) {
        // Tugas sudah lewat deadline atau deadline masih > 24 jam
        continue;
      }

      // Cek apakah notifikasi untuk task dan time_left ini sudah ada sebelumnya
      const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('id_notification')
        .eq('id_task', task.id_task)
        .eq('time_left', targetTimeLeft)
        .limit(1);

      if (checkError) {
        console.error(`Error checking existing notification for task ${task.id_task}:`, checkError);
        continue;
      }

      if (existing && existing.length > 0) {
        // Notifikasi sudah ada, abaikan untuk mencegah duplikasi
        notificationsSkipped++;
        continue;
      }

      // Sisipkan notifikasi baru ke database
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          id_task: task.id_task,
          time_left: targetTimeLeft,
          is_read: false,
          is_deleted: false,
          created_at: now.toISOString(),
          notification_type: 'task'
        });

      if (insertError) {
        console.error(`Error inserting notification for task ${task.id_task}:`, insertError);
        results.push({
          taskId: task.id_task,
          title: task.title,
          status: 'error',
          error: insertError.message
        });
      } else {
        notificationsCreated++;
        results.push({
          taskId: task.id_task,
          title: task.title,
          status: 'created',
          timeLeft: targetTimeLeft
        });
        console.log(`Notification (time_left = ${targetTimeLeft}) created for task: "${task.title}"`);

        // Send Push Notification if user has a push token
        const id_user = (task as any).course?.workspace?.id_user;
        if (id_user) {
          try {
            const { data: userRecord } = await supabase
              .from('users')
              .select('expo_push_token')
              .eq('id_user', id_user)
              .maybeSingle();

            if (userRecord?.expo_push_token) {
              const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                  "Accept": "application/json",
                  "Accept-encoding": "gzip, deflate",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: userRecord.expo_push_token,
                  sound: "default",
                  title: `Task Alert: ${task.title}`,
                  body: `Your task is due in ${targetTimeLeft} hours!`,
                  data: { id_task: task.id_task },
                }),
              });
              const pushResult = await pushResponse.json();
              console.log(`Push sent for task ${task.id_task} to user ${id_user}:`, pushResult);
            }
          } catch (pushErr: any) {
            console.error(`Failed to send push notification for task ${task.id_task}:`, pushErr.message);
          }
        }
      }
    }

    const totalOverdueMarked = overdueUpdated ? overdueUpdated.length : 0;
    const summary = {
      totalEvaluated: tasks?.length || 0,
      totalOverdueMarked,
      notificationsCreated,
      notificationsSkipped,
    };

    console.log('Cron Job Completed successfully:', summary);

    return new Response(JSON.stringify({ success: true, summary, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error('Unexpected error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
})
