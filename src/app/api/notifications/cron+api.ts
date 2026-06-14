import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aufnfbyzpsicgwepyhxx.supabase.co';
// Gunakan service role key jika ada agar server dapat melewati batasan RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1Zm5mYnl6cHNpY2d3ZXB5aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzUzMjgsImV4cCI6MjA3Mzg1MTMyOH0.W4Ov5qT71seyn0FK8jUN7_9TtKWrXOk5pMBpX0SN0Ds'; // fallback anon key

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export async function GET(request: Request): Promise<Response> {
  return handleCron();
}

export async function POST(request: Request): Promise<Response> {
  return handleCron();
}

async function handleCron(): Promise<Response> {
  try {
    console.log('[Cron Job] Starting notifications check...');
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Tandai semua tugas yang sudah lewat deadline (dan belum Completed/Overdue) menjadi "Overdue"
    const { data: overdueUpdated, error: overdueError } = await serverSupabase
      .from('task')
      .update({ status: 'Overdue' })
      .lt('deadline', now.toISOString())
      .neq('status', 'Completed')
      .neq('status', 'Overdue')
      .select('id_task, title, deadline');

    if (overdueError) {
      console.error('[Cron Job] Error marking tasks as overdue:', overdueError);
    } else if (overdueUpdated && overdueUpdated.length > 0) {
      console.log(`[Cron Job] Successfully marked ${overdueUpdated.length} tasks as Overdue:`, overdueUpdated.map(t => t.title));
    }

    // 2. Ambil semua tugas aktif (bukan Completed dan bukan Overdue) yang memiliki deadline
    const { data: tasks, error: tasksError } = await serverSupabase
      .from('task')
      .select('id_task, title, deadline, status')
      .neq('status', 'Completed')
      .neq('status', 'Overdue')
      .not('deadline', 'is', null);

    if (tasksError) {
      console.error('[Cron Job] Error fetching tasks:', tasksError);
      return Response.json({ error: tasksError.message }, { status: 500 });
    }

    const totalOverdueMarked = overdueUpdated ? overdueUpdated.length : 0;
    console.log(`[Cron Job] Found ${tasks?.length || 0} active tasks to evaluate. Marked ${totalOverdueMarked} as Overdue.`);

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
      const { data: existing, error: checkError } = await serverSupabase
        .from('notifications')
        .select('id_notification')
        .eq('id_task', task.id_task)
        .eq('time_left', targetTimeLeft)
        .limit(1);

      if (checkError) {
        console.error(`[Cron Job] Error checking existing notification for task ${task.id_task}:`, checkError);
        continue;
      }

      if (existing && existing.length > 0) {
        // Notifikasi sudah ada, abaikan untuk mencegah duplikasi
        notificationsSkipped++;
        continue;
      }

      // Sisipkan notifikasi baru ke database
      const { error: insertError } = await serverSupabase
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
        console.error(`[Cron Job] Error inserting notification for task ${task.id_task}:`, insertError);
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
        console.log(`[Cron Job] Notification (time_left = ${targetTimeLeft}) created for task: "${task.title}"`);
      }
    }

    console.log(`[Cron Job] Completed. Created: ${notificationsCreated}, Skipped: ${notificationsSkipped}`);

    return Response.json({
      success: true,
      summary: {
        totalEvaluated: tasks?.length || 0,
        totalOverdueMarked,
        notificationsCreated,
        notificationsSkipped,
      },
      details: results
    });

  } catch (error: any) {
    console.error('[Cron Job] Unexpected error:', error);
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
