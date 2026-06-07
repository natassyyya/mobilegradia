const BASE_URL = "https://gradia-three.vercel.app/api/auth";

/**
 * CORE REQUEST HANDLER
 */
async function request<T = any>(
  endpoint: string,
  body?: any,
  method: "POST" | "GET" = "POST"
): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body || {}) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    } as T;
  }
}

/* =========================
   NOTIFICATION API
========================= */

// GET ALL NOTIFICATIONS
export function getNotifications(user_id: string) {
  return request("", {
    action: "get-notifications",
    user_id,
  });
}

// MARK NOTIFICATION AS READ
export function markNotificationRead(notification_id: string) {
  return request("", {
    action: "mark-read",
    notification_id,
  });
}

// MARK ALL NOTIFICATIONS AS READ
export function markAllNotificationsRead(user_id: string) {
  return request("", {
    action: "mark-all-read",
    user_id,
  });
}

// DELETE NOTIFICATION
export function deleteNotification(notification_id: string) {
  return request("", {
    action: "delete-notification",
    notification_id,
  });
}
