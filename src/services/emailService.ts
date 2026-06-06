import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EXPO_PUBLIC_EMAIL_USER!;
const EMAIL_PASS = process.env.EXPO_PUBLIC_EMAIL_PASS!;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: `"Gradia App" <${EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
