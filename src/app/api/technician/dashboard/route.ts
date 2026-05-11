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

  if (me.role !== "TECHNICIAN" && !["ADMIN", "MANAGER"].includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = me.userId;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    todayJobs,
    activeJobs,
    completedToday,
    completedThisWeek,
    nextStop,
    recentTimesheet,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: {
        technicianId: userId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.workOrder.count({
      where: {
        technicianId: userId,
        status: { in: ["PENDING", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"] },
      },
    }),
    prisma.workOrder.count({
      where: {
        technicianId: userId,
        status: "COMPLETED",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.workOrder.count({
      where: {
        technicianId: userId,
        status: "COMPLETED",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.workOrder.findFirst({
      where: {
        technicianId: userId,
        status: { in: ["PENDING", "EN_ROUTE"] },
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        priority: true,
        scheduledAt: true,
        address: true,
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.timesheet.aggregate({
      where: { userId, date: { gte: weekAgo } },
      _sum: { hoursWorked: true },
    }),
  ]);

  return NextResponse.json({
    todayJobs,
    activeJobs,
    completedToday,
    completedThisWeek,
    hoursThisWeek: recentTimesheet._sum.hoursWorked ?? 0,
    nextStop,
  });
}
