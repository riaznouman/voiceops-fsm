import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  const ip = clientKey(request);
  const rl = rateLimit(`login:${ip}:${String(email).toLowerCase()}`, 100, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Please verify your email before signing in.", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  const token = sign(
    { sub: user.id, role: user.role },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "30d" }
  );

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
