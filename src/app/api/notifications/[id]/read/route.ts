import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json(
        { error: `Notification ${id} not found` },
        { status: 404 }
      );
    }

    if (notification.userId !== user.userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this notification" },
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("notification PATCH failed:", err);
    return NextResponse.json(
      { error: "Could not update notification. Please try again." },
      { status: 500 }
    );
  }
}
