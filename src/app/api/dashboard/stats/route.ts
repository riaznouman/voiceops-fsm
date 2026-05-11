import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalWorkOrders,
    pendingCount,
    enRouteCount,
    onSiteCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    todayJobs,
    activeTechnicians,
    unassignedJobs,
    recentActivity,
  ] = await Promise.all([
    prisma.workOrder.count(),
    prisma.workOrder.count({ where: { status: "PENDING" } }),
    prisma.workOrder.count({ where: { status: "EN_ROUTE" } }),
    prisma.workOrder.count({ where: { status: "ON_SITE" } }),
    prisma.workOrder.count({ where: { status: "IN_PROGRESS" } }),
    prisma.workOrder.count({ where: { status: "COMPLETED" } }),
    prisma.workOrder.count({ where: { status: "CANCELLED" } }),
    prisma.workOrder.count({
      where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.user.count({ where: { role: "TECHNICIAN", status: "ACTIVE" } }),
    prisma.workOrder.count({
      where: { technicianId: null, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true } },
        workOrder: { select: { referenceNumber: true } },
      },
    }),
  ]);

  const recentActivityFormatted = recentActivity.map((log) => {
    const actor = log.actor?.name ?? "Someone";
    const ref = log.workOrder?.referenceNumber ?? "a work order";
    let message: string;
    let type: string;
    switch (log.action) {
      case "STATUS_CHANGE":
        type = "STATUS_CHANGE";
        message = `${actor} changed ${ref} from ${log.fromValue ?? "?"} to ${log.toValue ?? "?"}`;
        break;
      case "ASSIGNED":
        type = "ASSIGNMENT";
        message = `${actor} assigned ${ref} to a technician`;
        break;
      case "NOTE":
        type = "NOTE";
        message = `${actor} added a note on ${ref}`;
        break;
      default:
        type = log.action;
        message = `${actor} · ${log.action.replace(/_/g, " ").toLowerCase()} on ${ref}`;
    }
    return {
      id: log.id,
      type,
      message,
      createdAt: log.createdAt,
    };
  });

  return NextResponse.json({
    totalWorkOrders,
    byStatus: {
      PENDING: pendingCount,
      EN_ROUTE: enRouteCount,
      ON_SITE: onSiteCount,
      IN_PROGRESS: inProgressCount,
      COMPLETED: completedCount,
      CANCELLED: cancelledCount,
    },
    todayJobs,
    activeTechnicians,
    unassignedJobs,
    recentActivity: recentActivityFormatted,
  });
}
