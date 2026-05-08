import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  await prisma.notification.updateMany({
    where: { userId: user.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ message: "All notifications marked as read" });
}
