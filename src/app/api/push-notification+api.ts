import { supabase } from '../../services/supabase';

/**
 * PUSH NOTIFICATION BACKEND ROUTE
 * 
 * Menerima request POST untuk mengirimkan push notification ke handphone user.
 * Kebutuhan Kolom Database:
 * Anda harus menambahkan kolom `expo_push_token` (bertipe `text`) di tabel `users` 
 * untuk menyimpan token Expo perangkat handphone pengguna saat mereka mendaftar/login.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const { id_user, title, body, data } = await request.json();

    if (!id_user || !title || !body) {
      return Response.json(
        { error: "Missing required fields: id_user, title, or body" },
        { status: 400 }
      );
    }

    // 1. Ambil expo_push_token dari tabel users
    const { data: userRecord, error: dbErr } = await supabase
      .from("users")
      .select("expo_push_token")
      .eq("id_user", id_user)
      .maybeSingle();

    if (dbErr) {
      console.error("[API push-notification] Database query error:", dbErr);
      return Response.json(
        { error: `Database error: ${dbErr.message}` },
        { status: 500 }
      );
    }

    if (!userRecord || !userRecord.expo_push_token) {
      console.warn(`[API push-notification] No push token found for user ID: ${id_user}`);
      return Response.json(
        { error: `User does not have a registered push token` },
        { status: 404 }
      );
    }

    const expoPushToken = userRecord.expo_push_token;

    // 2. Kirim request ke Expo Push Notification API
    console.log(`[API push-notification] Sending push to token: ${expoPushToken}`);
    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title: title,
        body: body,
        data: data || {},
      }),
    });

    const expoResult = await expoResponse.json();

    if (!expoResponse.ok) {
      throw new Error(expoResult.errors?.[0]?.message || "Expo API response failed");
    }

    console.log("[API push-notification] Push notification triggered successfully:", expoResult);
    return Response.json({ success: true, result: expoResult });
  } catch (error: any) {
    console.error("[API push-notification] Error triggering push notification:", error);
    return Response.json(
      { error: error.message || "Failed to trigger push notification" },
      { status: 500 }
    );
  }
}
