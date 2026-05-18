import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { createWithRef } from "@/lib/ref-number";
import { notify } from "@/lib/notify";
import type { Prisma, WorkOrderStatus } from "@prisma/client";

const VALID_STATUSES: WorkOrderStatus[] = [
  "PENDING",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// GET /api/work-orders - list work orders (with filters + pagination)
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const technicianId = searchParams.get("technicianId");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const pageSize = Number.isNaN(pageSizeRaw) || pageSizeRaw < 1 || pageSizeRaw > 100 ? 20 : pageSizeRaw;

  if (status && !VALID_STATUSES.includes(status as WorkOrderStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const where: Prisma.WorkOrderWhereInput = {};

  // role-based scoping
  if (user.role === "TECHNICIAN") {
    where.technicianId = user.userId;
  } else if (user.role === "CUSTOMER") {
    where.customerId = user.userId;
  }

  if (status) where.status = status as WorkOrderStatus;
  if (technicianId) where.technicianId = technicianId;
  if (customerId) where.customerId = customerId;

  if (from || to) {
    const scheduledAt: Prisma.DateTimeNullableFilter = {};
    if (from) {
      const d = new Date(`${from}T00:00:00`);
      if (!isNaN(d.getTime())) scheduledAt.gte = d;
    }
    if (to) {
      const d = new Date(`${to}T23:59:59.999`);
      if (!isNaN(d.getTime())) scheduledAt.lte = d;
    }
    where.scheduledAt = scheduledAt;
  }

  const [total, data] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data, page, pageSize, total });
}

// POST /api/work-orders - create a new work order (admin/manager only)
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to create work orders." }, { status: 403 });
  }

  const body = await request.json();
  const { customerId, serviceId, priority, scheduledAt, address, issueDescription } = body;

  if (!customerId) {
    return NextResponse.json({ error: "Please select a customer for this work order." }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "We couldn't find that customer." }, { status: 400 });
  }

  const workOrder = await createWithRef(
    "VO",
    () => prisma.workOrder.count(),
    (referenceNumber) =>
      prisma.workOrder.create({
        data: {
          referenceNumber,
          customerId,
          serviceId,
          priority: priority || "NORMAL",
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          address,
          issueDescription,
        },
      })
  );

  await notify(
    customerId,
    "BOOKING_CREATED",
    "Your booking is confirmed",
    `Work order ${workOrder.referenceNumber} has been created for you.`,
    `/customer/work-orders/${workOrder.id}`
  );

  return NextResponse.json(workOrder, { status: 201 });
}
