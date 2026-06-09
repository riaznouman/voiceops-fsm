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

interface InvoiceEmailData {
  customerName: string;
  referenceNumber: string;
  lineItems: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate?: Date | null;
  notes?: string | null;
}

export async function sendInvoiceEmail(to: string, invoice: InvoiceEmailData) {
  const transport = getTransport();
  const money = (n: number) => `$${n.toFixed(2)}`;

  const rows = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${item.description}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; text-align: right;">${money(item.unitPrice)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; text-align: right;">${money(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const textLines = invoice.lineItems
    .map((item) => `  ${item.description} x${item.quantity} @ ${money(item.unitPrice)} = ${money(item.lineTotal)}`)
    .join("\n");

  const dueLine = invoice.dueDate
    ? `Due date: ${new Date(invoice.dueDate).toLocaleDateString()}`
    : "";

  await transport.sendMail({
    from: `"VoiceOps" <${GMAIL_ADDRESS}>`,
    to,
    subject: `Invoice ${invoice.referenceNumber} from VoiceOps`,
    text:
      `Hi ${invoice.customerName},\n\n` +
      `Please find your invoice ${invoice.referenceNumber} below.\n\n` +
      `${textLines}\n\n` +
      `Subtotal: ${money(invoice.subtotal)}\n` +
      `GST (10%): ${money(invoice.taxAmount)}\n` +
      `Total: ${money(invoice.total)}\n` +
      (dueLine ? `${dueLine}\n` : "") +
      (invoice.notes ? `\nNotes: ${invoice.notes}\n` : "") +
      `\nThank you for your business.\nVoiceOps`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin: 0 0 4px;">Invoice ${invoice.referenceNumber}</h2>
        <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">${dueLine}</p>
        <p style="color: #4b5563; margin: 0 0 16px;">Hi ${invoice.customerName}, please find your invoice below.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              <th style="padding: 8px 12px; border-bottom: 2px solid #d1d5db; text-align: left; color: #6b7280;">Description</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #d1d5db; text-align: center; color: #6b7280;">Qty</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #d1d5db; text-align: right; color: #6b7280;">Unit</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #d1d5db; text-align: right; color: #6b7280;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 16px; text-align: right; color: #4b5563; font-size: 14px;">
          <div style="padding: 2px 0;">Subtotal: ${money(invoice.subtotal)}</div>
          <div style="padding: 2px 0;">GST (10%): ${money(invoice.taxAmount)}</div>
          <div style="padding: 8px 0 0; font-size: 18px; font-weight: 700; color: #111827;">Total: ${money(invoice.total)}</div>
        </div>
        ${invoice.notes ? `<p style="color: #6b7280; margin: 20px 0 0; font-size: 13px;">Notes: ${invoice.notes}</p>` : ""}
        <p style="color: #6b7280; margin: 24px 0 0; font-size: 13px;">Thank you for your business.<br/>VoiceOps</p>
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
