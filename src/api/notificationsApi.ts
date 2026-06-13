import { supabase } from "../services/supabase";

export interface DBNotification {
  id_notification: number;
  id_user: number;
  id_task: number;
  is_read: boolean;
  created_at: string;
  task?: {
    id_task: number;
    title: string;          // nama tugas/event
    deadline?: string;      // deadline
    priority?: string;      // priority (High, Medium, Low)
    status?: string;        // status (Not started, In progress, Completed)
    id_course?: number;
    course?: {
      name: string;         // nama mata kuliah
    };
  };
}

// 1. GET ALL NOTIFICATIONS (List notif)
export async function getNotifications(id_user: number): Promise<DBNotification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id_notification,
        id_user,
        id_task,
        is_read,
        created_at,
        task:id_task (
          id_task,
          title,
          deadline,
          priority,
          status,
          id_course,
          course:id_course (
            name
          )
        )
      `)
      .eq("id_user", id_user)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any) || [];
  } catch (err: any) {
    console.error("[notificationsApi] getNotifications failed:", err.message);
    throw err;
  }
}

// 2. GET UNREAD NOTIFICATIONS COUNT (Angka lonceng)
export async function getUnreadCount(id_user: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("id_user", id_user)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (err: any) {
    console.error("[notificationsApi] getUnreadCount failed:", err.message);
    throw err;
  }
}

// 3. PATCH MARK NOTIFICATION AS READ (Tandai per ID)
export async function markNotificationAsRead(id_notification: number): Promise<DBNotification | null> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id_notification", id_notification)
      .select(`
        id_notification,
        id_user,
        id_task,
        is_read,
        created_at,
        task:id_task (
          id_task,
          title,
          deadline,
          priority,
          status,
          id_course,
          course:id_course (
            name
          )
        )
      `)
      .maybeSingle();

    if (error) throw error;
    return data as any;
  } catch (err: any) {
    console.error("[notificationsApi] markNotificationAsRead failed:", err.message);
    throw err;
  }
}

// 4. PATCH MARK ALL AS READ (Mark all as read)
export async function markAllNotificationsAsRead(id_user: number): Promise<DBNotification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id_user", id_user)
      .eq("is_read", false)
      .select(`
        id_notification,
        id_user,
        id_task,
        is_read,
        created_at,
        task:id_task (
          id_task,
          title,
          deadline,
          priority,
          status,
          id_course,
          course:id_course (
            name
          )
        )
      `);

    if (error) throw error;
    return (data as any) || [];
  } catch (err: any) {
    console.error("[notificationsApi] markAllNotificationsAsRead failed:", err.message);
    throw err;
  }
}
