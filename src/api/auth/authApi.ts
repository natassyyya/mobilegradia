const BASE_URL = "https://gradia-three.vercel.app/api/auth";

/**
 * =========================
 * CORE REQUEST HANDLER
 * =========================
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

//AUTH API

// REGISTER
export function register(
  username: string,
  email: string,
  password: string
) {
  return request("", {
    action: "register",
    username,
    email,
    password,
  });
}

// LOGIN
export function login(text: string, password: string) {
  return request("", {
    action: "login",
    text,
    password,
  });
}

// LOGOUT
export function logout() {
  return request("", {
    action: "logout",
  });
}

// VERIFY OTP (REGISTER / RESET)
export function verifyOtp(email: string, otp_code: string, action?: string) {
  return request("/verifyOtp", {
    email,
    otp_code,
    action,
    purpose: action,
  });
}

// SEND RESET OTP
export function sendResetOtp(email: string) {
  return request("/resetPassword", {
    action: "send-otp",
    email,
  });
}

// CHANGE PASSWORD
export function changePassword(email: string, new_password: string) {
  return request("/resetPassword", {
    action: "change-password",
    email,
    new_password,
  });
}

// SEND OTP GENERAL
export function sendOtp(email: string, purpose: string) {
  return request("/sendOtp", {
    email,
    purpose,
    action: purpose,
  });
}

// GET GOOGLE AUTH URL
export async function getGoogleAuthUrl() {
  try {
    const res = await fetch("https://gradia-three.vercel.app/api/auth/google/server");
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { error: err.message };
  }
}

// GOOGLE CALLBACK
export async function googleCallback(access_token: string, refresh_token: string) {
  try {
    const res = await fetch("https://gradia-three.vercel.app/api/auth/google/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token, refresh_token }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { error: err.message };
  }
}