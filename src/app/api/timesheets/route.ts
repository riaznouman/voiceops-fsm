import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Tech only sees own; admin/manager can pass userId or see all
  let userId: string | undefined;
  if (me.role === "TECHNICIAN" || me.role === "CUSTOMER") {
    userId = me.userId;
  } else if (userIdParam) {
    userId = userIdParam;
  }

  const where: {
    userId?: string;
    date?: { gte?: Date; lte?: Date };
  } = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  const data = await prisma.timesheet.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      workOrder: { select: { id: true, referenceNumber: true } },
      user: { select: { id: true, name: true } },
    },
  });

  const totalHours = data.reduce((sum, t) => sum + t.hoursWorked, 0);

  return NextResponse.json({ data, totalHours });
}

export async function POST(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await request.json();
  const { date, hoursWorked, notes, workOrderId } = body;

  if (!date || typeof hoursWorked !== "number") {
    return NextResponse.json(
      { error: "date and hoursWorked are required" },
      { status: 400 }
    );
  }
  if (hoursWorked <= 0 || hoursWorked > 24) {
    return NextResponse.json(
      { error: "hoursWorked must be between 0 and 24" },
      { status: 400 }
    );
  }

  const timesheet = await prisma.timesheet.create({
    data: {
      userId: me.userId,
      workOrderId: workOrderId || null,
      date: new Date(date),
      hoursWorked,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(timesheet, { status: 201 });
}
