import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EXPO_PUBLIC_EMAIL_USER || 'gradianoreplay@gmail.com';
const EMAIL_PASS = process.env.EXPO_PUBLIC_EMAIL_PASS || 'wngp bsdw zexw qjub';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function POST(request: Request): Promise<Response> {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return Response.json(
        { error: 'Missing required fields: to, subject, or html' },
        { status: 400 }
      );
    }

    const info = await transporter.sendMail({
      from: `"Gradia App" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`[API send-email] Email sent successfully: ${info.messageId}`);
    return Response.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[API send-email] Error sending email via SMTP:', error);
    return Response.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
