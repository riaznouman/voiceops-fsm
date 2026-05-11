import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "Authentication required" },
      { status: e.status ?? 401 }
    );
  }

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (err) {
    console.error("notifications read-all failed:", err);
    return NextResponse.json(
      { error: "Could not mark notifications as read. Please try again." },
      { status: 500 }
    );
  }
}
