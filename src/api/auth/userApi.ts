const BASE_URL = "https://gradia-three.vercel.app/api/auth";

/**
 * CORE REQUEST
 */
async function request<T = any>(
  endpoint: string,
  body?: any,
  method: "POST" | "GET" = "POST",
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

//User Api

// GET PROFILE
export function getProfile(user_id: string) {
  return request("", {
    action: "get-profile",
    user_id,
  });
}

// UPDATE PROFILE
export function updateProfile(
  user_id: string,
  username?: string,
  email?: string,
) {
  return request("", {
    action: "update-profile",
    user_id,
    username,
    email,
  });
}

// GET USER BY ID
export function getUserById(user_id: string) {
  return request("", {
    action: "get-user",
    user_id,
  });
}
