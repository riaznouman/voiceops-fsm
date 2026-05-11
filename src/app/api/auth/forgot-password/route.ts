import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetCodeEmail } from "@/lib/mailer";

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok so we don't leak whether the email is registered
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  if (
    user.resetCodeSentAt &&
    Date.now() - user.resetCodeSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    // Silently treat as success to avoid leaking + avoid spamming
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  const hashedCode = await hash(code, 8);
  const now = new Date();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCode: hashedCode,
      resetCodeExpiresAt: new Date(now.getTime() + CODE_TTL_MS),
      resetCodeSentAt: now,
    },
  });

  try {
    await sendPasswordResetCodeEmail(email, code);
  } catch (err) {
    console.error("[forgot-password] failed to send email", err);
    // Still return ok to avoid leaking; admin can check logs
  }

  return NextResponse.json({ ok: true });
}
