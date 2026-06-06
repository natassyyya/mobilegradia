import { supabase } from "./supabase";
import { sendEmail } from "./emailService";

export async function sendOtp(user: any, purpose: string) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase.from("otp").insert([
    {
      id_user: user.id_user,
      otp_code: otpCode,
      expires_at: expiresAt,
      is_used: false,
      purpose,
    },
  ]);

  if (error) throw error;

  await sendEmail(
    user.email,
    "Your OTP Code - Verify Your Account",
    `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3>Hello ${user.username || user.email},</h3>

      <p>Your OTP code is:</p>

      <h2 style="letter-spacing: 4px; color: #007bff;">
        ${otpCode}
      </h2>

      <p>
        This code will expire at
        <b>${new Date(expiresAt).toLocaleString()}</b>.
      </p>

      <br/>

      <p>
        Please use this code to verify your account.
        <br/>
        Thank you,
        <br/>
        The Gradia Team
      </p>
    </div>
  `,
  );

  return {
    otpCode,
    expiresAt,
  };
}
