import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
  }

  if (!user.verificationCode || !user.verificationCodeExpiresAt) {
    return NextResponse.json(
      { error: "No active code. Please request a new one." },
      { status: 400 }
    );
  }

  if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Code has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const valid = await compare(String(code), user.verificationCode);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationCode: null,
      verificationCodeExpiresAt: null,
      verificationCodeSentAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
