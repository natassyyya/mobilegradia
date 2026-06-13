export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    return data;
  } catch (err: any) {
    console.error('[emailService] Error sending email:', err);
    throw err;
  }
}
