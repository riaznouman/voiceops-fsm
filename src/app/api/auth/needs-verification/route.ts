import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ needsVerification: false });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true },
  });

  // Don't leak account existence; only signal "needs verification" when account exists AND is unverified
  return NextResponse.json({
    needsVerification: Boolean(user && !user.emailVerifiedAt),
  });
}
