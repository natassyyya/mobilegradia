import { supabase } from "../services/supabase";

export interface DBNotification {
  id_notification: number;
  id_task: number;
  time_left: number;
  is_read: boolean;
  is_deleted: boolean;
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
      id_workspace?: number;
      workspace?: {
        id_user: number;
      };
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
        id_task,
        time_left,
        is_read,
        is_deleted,
        created_at,
        task:id_task!inner (
          id_task,
          title,
          deadline,
          priority,
          status,
          id_course,
          course:id_course!inner (
            name,
            id_workspace,
            workspace:id_workspace!inner (
              id_user
            )
          )
        )
      `)
      .eq("task.course.workspace.id_user", id_user)
      .eq("is_deleted", false)
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
      .select(`
        id_notification,
        task:id_task!inner (
          id_course,
          course:id_course!inner (
            id_workspace,
            workspace:id_workspace!inner (
              id_user
            )
          )
        )
      `, { count: "exact", head: true })
      .eq("task.course.workspace.id_user", id_user)
      .eq("is_read", false)
      .eq("is_deleted", false);

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
        id_task,
        time_left,
        is_read,
        is_deleted,
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
    // Ambil daftar ID notifikasi aktif belum dibaca milik user
    const { data: unreadNotifs, error: fetchError } = await supabase
      .from("notifications")
      .select(`
        id_notification,
        task:id_task!inner (
          id_course,
          course:id_course!inner (
            id_workspace,
            workspace:id_workspace!inner (
              id_user
            )
          )
        )
      `)
      .eq("task.course.workspace.id_user", id_user)
      .eq("is_read", false)
      .eq("is_deleted", false);

    if (fetchError) throw fetchError;

    const ids = (unreadNotifs || []).map((n) => n.id_notification);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id_notification", ids)
      .select(`
        id_notification,
        id_task,
        time_left,
        is_read,
        is_deleted,
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

// 5. DELETE NOTIFICATION (Soft delete)
export async function deleteNotification(id_notification: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .eq("id_notification", id_notification);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error("[notificationsApi] deleteNotification failed:", err.message);
    throw err;
  }
}

// 6. DELETE ALL NOTIFICATIONS (Soft delete all)
export async function deleteAllNotifications(id_user: number): Promise<boolean> {
  try {
    // Ambil daftar ID notifikasi aktif milik user
    const { data: activeNotifs, error: fetchError } = await supabase
      .from("notifications")
      .select(`
        id_notification,
        task:id_task!inner (
          id_course,
          course:id_course!inner (
            id_workspace,
            workspace:id_workspace!inner (
              id_user
            )
          )
        )
      `)
      .eq("task.course.workspace.id_user", id_user)
      .eq("is_deleted", false);

    if (fetchError) throw fetchError;

    const ids = (activeNotifs || []).map((n) => n.id_notification);
    if (ids.length === 0) return true;

    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .in("id_notification", ids);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error("[notificationsApi] deleteAllNotifications failed:", err.message);
    throw err;
  }
}


