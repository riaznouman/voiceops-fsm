import nodemailer from "nodemailer";

const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (!GMAIL_ADDRESS || !GMAIL_APP_PASSWORD) {
    throw new Error(
      "Mailer not configured: GMAIL_ADDRESS and GMAIL_APP_PASSWORD must be set in .env"
    );
  }
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_ADDRESS, pass: GMAIL_APP_PASSWORD },
    });
  }
  return cachedTransport;
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: `"VoiceOps" <${GMAIL_ADDRESS}>`,
    to,
    subject: "Your VoiceOps verification code",
    text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request it, ignore this email.`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin: 0 0 12px;">Verify your email</h2>
        <p style="color: #4b5563; margin: 0 0 16px;">Enter this code on the verification page to activate your VoiceOps account.</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">${code}</div>
        <p style="color: #6b7280; margin: 16px 0 0; font-size: 13px;">This code expires in 15 minutes. If you didn't request it, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetCodeEmail(to: string, code: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: `"VoiceOps" <${GMAIL_ADDRESS}>`,
    to,
    subject: "Your VoiceOps password reset code",
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request a reset, ignore this email and your password will stay the same.`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin: 0 0 12px;">Reset your password</h2>
        <p style="color: #4b5563; margin: 0 0 16px;">Enter this code on the reset page along with your new password.</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">${code}</div>
        <p style="color: #6b7280; margin: 16px 0 0; font-size: 13px;">This code expires in 15 minutes. If you didn't request a reset, ignore this email and your password will stay the same.</p>
      </div>
    `,
  });
}
