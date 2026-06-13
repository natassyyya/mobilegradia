import { supabase } from '../../services/supabase';
import bcrypt from 'bcryptjs';

// REGISTER
export async function register(
  username: string,
  email: string,
  password: string
) {
  try {
    // 1. Sign up user in Supabase Auth
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpErr) {
      return { success: false, error: signUpErr.message };
    }

    // 2. Hash the password locally for custom users table compatibility
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // 3. Check if user already exists in public users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let dbUser;
    if (existingUser) {
      // Update existing record
      const { data: updatedUser, error: updateErr } = await supabase
        .from('users')
        .update({
          username,
          password: hashedPassword,
          is_verified: false,
          supabase_uid: signUpData.user?.id || null,
        })
        .eq('id_user', existingUser.id_user)
        .select()
        .single();

      if (updateErr) return { success: false, error: updateErr.message };
      dbUser = updatedUser;
    } else {
      // Insert new record
      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            password: hashedPassword,
            is_verified: false,
            supabase_uid: signUpData.user?.id || null,
          },
        ])
        .select()
        .single();

      if (insertErr) return { success: false, error: insertErr.message };
      dbUser = newUser;
    }

    // 4. Generate and send OTP via local API
    const otpRes = await sendOtp(email, 'registration');
    if (otpRes.error) {
      return { success: false, error: otpRes.error };
    }

    return {
      message: "Registration successful. OTP has been sent for verification.",
      user: dbUser,
      expires_at: otpRes.expires_at,
      purpose: 'registration',
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// LOGIN
export async function login(text: string, password: string) {
  try {
    let email = text;

    // Check if input is a username instead of an email
    if (!text.includes('@')) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('email')
        .eq('username', text)
        .maybeSingle();

      if (userRecord) {
        email = userRecord.email;
      }
    }

    // 1. Fetch user from public users table first
    let { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (dbUser) {
      // 2. Verify password locally via bcrypt
      const isPasswordValid = bcrypt.compareSync(password, dbUser.password);
      if (isPasswordValid) {
        // If they don't have a supabase_uid, sign them up in Supabase Auth in the background
        if (!dbUser.supabase_uid) {
          try {
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email,
              password,
            });

            if (!signUpErr && signUpData.user) {
              const { data: updatedUser } = await supabase
                .from('users')
                .update({ supabase_uid: signUpData.user.id, is_verified: true })
                .eq('id_user', dbUser.id_user)
                .select()
                .single();
              if (updatedUser) {
                dbUser = updatedUser;
              }
            }
          } catch (e) {
            console.warn("Background Supabase signup failed:", e);
          }
        } else {
          // If they have a supabase_uid, try to sign in via Supabase Auth to establish the session
          try {
            await supabase.auth.signInWithPassword({
              email,
              password,
            });
          } catch (e) {
            console.warn("Background Supabase signin failed:", e);
          }
        }

        // Check verification status
        if (!dbUser.is_verified) {
          await sendOtp(email, 'registration');
          return {
            error: "User is not verified. Please verify your OTP.",
            requireVerification: true,
            email: email,
            purpose: 'registration',
          };
        }

        return {
          success: true,
          user: dbUser,
        };
      } else {
        return { success: false, error: "Invalid email/username or password." };
      }
    } else {
      // If user does not exist in public.users, try Supabase Auth directly (e.g. for new OAuth/Auth users)
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        return { success: false, error: signInErr.message };
      }

      // Create public profile if authenticated but public profile is missing
      const { data: newUser, error: insErr } = await supabase
        .from('users')
        .insert([
          {
            username: email.split('@')[0],
            email: email,
            password: bcrypt.hashSync(password, 10),
            is_verified: true,
            supabase_uid: signInData.user?.id || null,
          },
        ])
        .select()
        .single();

      if (insErr) return { success: false, error: insErr.message };
      dbUser = newUser;

      return {
        success: true,
        user: dbUser,
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// LOGOUT
export async function logout() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// VERIFY OTP (REGISTER / RESET)
export async function verifyOtp(email: string, otp_code: string, action?: string) {
  try {
    // 1. Get user
    const { data: userRecord } = await supabase
      .from('users')
      .select('id_user')
      .eq('email', email)
      .maybeSingle();

    if (!userRecord) {
      return { success: false, error: "User not found." };
    }

    // 2. Find OTP record
    const { data: otpRecord } = await supabase
      .from('otp')
      .select('*')
      .eq('id_user', userRecord.id_user)
      .eq('otp_code', otp_code)
      .eq('is_used', false)
      .eq('purpose', action || 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return { success: false, error: "Invalid OTP code." };
    }

    // 3. Check expiration
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return { success: false, error: "OTP code has already been expired." };
    }

    // 4. Mark as used
    await supabase
      .from('otp')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id_otp', otpRecord.id_otp);

    // 5. Update user verification status
    if (action === 'registration' || action === 'register') {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id_user', userRecord.id_user);
    }

    return {
      otp_verified: true,
      message: "Verification successful",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// SEND RESET OTP
export async function sendResetOtp(email: string) {
  return sendOtp(email, 'reset-password');
}

// CHANGE PASSWORD
export async function changePassword(email: string, new_password: string) {
  try {
    // 1. Update Supabase Auth user
    const { error: authErr } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (authErr) {
      console.warn("Supabase Auth password update warning:", authErr.message);
    }

    // 2. Update public users table
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(new_password, salt);

    const { data: userRecord, error: dbErr } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email)
      .select()
      .single();

    if (dbErr) {
      return { success: false, status: 'error', error: dbErr.message };
    }

    return { success: true, status: 'success', user: userRecord };
  } catch (err: any) {
    return { success: false, status: 'error', error: err.message };
  }
}

// SEND OTP GENERAL
export async function sendOtp(email: string, purpose: string) {
  try {
    // 1. Get user
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!userRecord) {
      return { error: "User not found." };
    }

    // 2. Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 3. Save to database
    const { error: insertErr } = await supabase
      .from('otp')
      .insert([
        {
          id_user: userRecord.id_user,
          otp_code: otpCode,
          expires_at: expiresAt,
          is_used: false,
          purpose: purpose || 'registration',
        },
      ]);

    if (insertErr) {
      return { error: insertErr.message };
    }

    // 4. Send email with custom HTML body
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #6C5DD3; text-align: center;">Verify Your Gradia Account</h2>
        <p>Hello <b>${userRecord.username || email}</b>,</p>
        <p>Please use the following One-Time Password (OTP) code to verify your action. This code is valid for 5 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #6C5DD3; border: 2px dashed #6C5DD3; padding: 10px 20px; border-radius: 4px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p>If you did not request this verification code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message from Gradia App.</p>
      </div>
    `;

    const { sendEmail } = require('../../services/emailService');
    await sendEmail(email, "Your OTP Verification Code", htmlContent);

    return {
      success: true,
      expires_at: expiresAt,
      purpose: purpose || 'registration',
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

// GET GOOGLE AUTH URL
export async function getGoogleAuthUrl(customRedirectUrl?: string) {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aufnfbyzpsicgwepyhxx.supabase.co';
    const redirectUrl = customRedirectUrl || "https://gradia-three.vercel.app/auth/login";
    const url = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    return { url };
  } catch (err: any) {
    return { error: err.message };
  }
}

// GOOGLE CALLBACK
export async function googleCallback(access_token: string, refresh_token: string) {
  try {
    // 1. Authenticate with Supabase using the Google session tokens
    const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionErr || !sessionData.user) {
      return { error: sessionErr?.message || "Invalid session details" };
    }

    const email = sessionData.user.email;
    const username = sessionData.user.user_metadata?.full_name || email?.split('@')[0] || 'Google User';

    // 2. Sync profile in custom public users table
    let { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!dbUser) {
      // Insert new profile
      const { data: newUser, error: insErr } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            password: bcrypt.hashSync('GoogleOAuthUserDummyPassword', 10),
            is_verified: true,
            supabase_uid: sessionData.user.id,
          },
        ])
        .select()
        .single();

      if (insErr) return { error: insErr.message };
      dbUser = newUser;
    } else {
      // Sync uid and verification status if missing
      if (!dbUser.supabase_uid || dbUser.supabase_uid !== sessionData.user.id || !dbUser.is_verified) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            supabase_uid: sessionData.user.id,
            is_verified: true,
          })
          .eq('id_user', dbUser.id_user)
          .select()
          .single();
        if (updatedUser) {
          dbUser = updatedUser;
        }
      }
    }

    return {
      id_user: dbUser.id_user,
      username: dbUser.username,
      email: dbUser.email,
    };
  } catch (err: any) {
    return { error: err.message };
  }
}