import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { token } = await request.json();

  if (typeof token !== "string" || token.length < 10) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: me.userId },
    data: { pushToken: token },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  await prisma.user.update({
    where: { id: me.userId },
    data: { pushToken: null },
  });

  return NextResponse.json({ ok: true });
}
