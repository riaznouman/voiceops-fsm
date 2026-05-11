import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/mailer";

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

  // Don't leak whether the email exists
  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({ ok: true });
  }

  if (
    user.verificationCodeSentAt &&
    Date.now() - user.verificationCodeSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - user.verificationCodeSentAt.getTime())) / 1000
    );
    return NextResponse.json(
      { error: `Please wait ${waitSeconds}s before requesting another code.` },
      { status: 429 }
    );
  }

  const code = generateCode();
  const hashedCode = await hash(code, 8);
  const now = new Date();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: hashedCode,
      verificationCodeExpiresAt: new Date(now.getTime() + CODE_TTL_MS),
      verificationCodeSentAt: now,
    },
  });

  try {
    await sendVerificationCodeEmail(email, code);
  } catch (err) {
    console.error("[resend-verification] failed to send email", err);
    return NextResponse.json(
      { error: "Could not send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
