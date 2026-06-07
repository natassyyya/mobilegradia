const BASE_URL = "https://gradia-three.vercel.app/api/auth";

/**
 * CORE REQUEST
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
   TASK API
========================= */

// CREATE TASK
export function createTask(
  user_id: string,
  title: string,
  description?: string
) {
  return request("", {
    action: "create",
    user_id,
    title,
    description,
  });
}

// GET ALL TASK
export function getTasks(user_id: string) {
  return request("", {
    action: "get",
    user_id,
  });
}

// UPDATE TASK
export function updateTask(
  task_id: string,
  title?: string,
  description?: string,
  status?: string
) {
  return request("", {
    action: "update",
    task_id,
    title,
    description,
    status,
  });
}

// DELETE TASK
export function deleteTask(task_id: string) {
  return request("", {
    action: "delete",
    task_id,
  });
}

// MARK DONE
export function markTaskDone(task_id: string) {
  return request("", {
    action: "done",
    task_id,
  });
}