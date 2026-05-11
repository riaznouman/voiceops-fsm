import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (err) {
    console.error("notifications GET failed:", err);
    return NextResponse.json(
      { error: "Could not load notifications. Please try again." },
      { status: 500 }
    );
  }
}
