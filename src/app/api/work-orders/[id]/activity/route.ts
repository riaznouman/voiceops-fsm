import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    select: { id: true, customerId: true, technicianId: true },
  });
  if (!wo) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (user.role === "TECHNICIAN" && wo.technicianId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "CUSTOMER" && wo.customerId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.activityLog.findMany({
    where: { workOrderId: id },
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
