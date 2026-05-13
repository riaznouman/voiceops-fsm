import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientKey(request);
  const rl = rateLimit(`reset:${ip}`, 100, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { email, code, password } = await request.json();

  if (!email || !code || !password) {
    return NextResponse.json(
      { error: "Email, code and new password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.resetCode || !user.resetCodeExpiresAt) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  if (user.resetCodeExpiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Code has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const valid = await compare(String(code), user.resetCode);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetCode: null,
      resetCodeExpiresAt: null,
      resetCodeSentAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
