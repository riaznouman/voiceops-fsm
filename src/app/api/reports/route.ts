import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import type { WorkOrderStatus } from "@prisma/client";

const STATUSES: WorkOrderStatus[] = [
  "PENDING",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function parseDate(s: string | null, fallback: Date): Date {
  if (!s) return fallback;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  if (!["ADMIN", "MANAGER"].includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const from = parseDate(searchParams.get("from"), defaultFrom);
  const to = parseDate(searchParams.get("to"), now);

  // Normalize boundaries
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const periodFilter = { createdAt: { gte: from, lte: to } };

  const [statusCounts, totalInPeriod, completedInPeriod, completedRows, perTech, perService] =
    await Promise.all([
      Promise.all(
        STATUSES.map((status) =>
          prisma.workOrder
            .count({ where: { ...periodFilter, status } })
            .then((count) => [status, count] as const)
        )
      ),
      prisma.workOrder.count({ where: periodFilter }),
      prisma.workOrder.count({ where: { ...periodFilter, status: "COMPLETED" } }),
      prisma.workOrder.findMany({
        where: { ...periodFilter, status: "COMPLETED" },
        select: { createdAt: true, updatedAt: true },
      }),
      prisma.workOrder.groupBy({
        by: ["technicianId"],
        where: { ...periodFilter, status: "COMPLETED", technicianId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { technicianId: "desc" } },
      }),
      prisma.workOrder.groupBy({
        by: ["serviceId"],
        where: { ...periodFilter, serviceId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { serviceId: "desc" } },
      }),
    ]);

  // Avg completion time in hours
  let avgCompletionHours: number | null = null;
  if (completedRows.length > 0) {
    const totalMs = completedRows.reduce(
      (sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()),
      0
    );
    avgCompletionHours = totalMs / completedRows.length / 1000 / 3600;
  }

  // Hydrate technician + service names
  const techIds = perTech.map((t) => t.technicianId).filter((x): x is string => x !== null);
  const serviceIds = perService.map((s) => s.serviceId).filter((x): x is string => x !== null);

  const [techs, services] = await Promise.all([
    techIds.length
      ? prisma.user.findMany({
          where: { id: { in: techIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    serviceIds.length
      ? prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const techNameById = new Map(techs.map((t) => [t.id, t.name]));
  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      total: totalInPeriod,
      completed: completedInPeriod,
      completionRate: totalInPeriod > 0 ? completedInPeriod / totalInPeriod : 0,
      avgCompletionHours,
    },
    byStatus: Object.fromEntries(statusCounts),
    perTechnician: perTech.map((row) => ({
      technicianId: row.technicianId,
      name: techNameById.get(row.technicianId ?? "") ?? "Unknown",
      completed: row._count._all,
    })),
    perService: perService.map((row) => ({
      serviceId: row.serviceId,
      name: serviceNameById.get(row.serviceId ?? "") ?? "Unknown",
      total: row._count._all,
    })),
  });
}
