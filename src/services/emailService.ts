import { supabase } from './supabase';

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });
    
    if (error) {
      throw error;
    }
    return data;
  } catch (err: any) {
    console.error('[emailService] Error sending email via Supabase Edge Function:', err);
    throw err;
  }
}
