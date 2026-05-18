import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/mailer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 15 * 60 * 1000;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "This email is already registered. Try signing in instead." }, { status: 409 });
  }

  const hashedPassword = await hash(password, 12);
  const code = generateCode();
  const hashedCode = await hash(code, 8);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      password: hashedPassword,
      role: "CUSTOMER",
      verificationCode: hashedCode,
      verificationCodeExpiresAt: expiresAt,
      verificationCodeSentAt: now,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  try {
    await sendVerificationCodeEmail(email, code);
  } catch (err) {
    console.error("[register] failed to send verification email", err);
    return NextResponse.json(
      { error: "Account created but we couldn't send the verification email. Please request a new code." },
      { status: 500 }
    );
  }

  return NextResponse.json(user, { status: 201 });
}
