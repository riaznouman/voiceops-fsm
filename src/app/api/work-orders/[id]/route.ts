import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { logActivity } from "@/lib/activity-log";
import {
  InvalidTransitionError,
  VALID_STATUSES,
  assertTransition,
} from "@/lib/work-order-status";
import type { WorkOrderStatus } from "@prisma/client";

const TECHNICIAN_ALLOWED_TARGETS: WorkOrderStatus[] = [
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
];

// Fields a client can update via PATCH, scoped by role.
const ADMIN_UPDATE_FIELDS = [
  "status",
  "technicianId",
  "scheduledAt",
  "priority",
  "issueDescription",
  "resolutionNotes",
  "address",
  "lat",
  "lng",
  "serviceId",
  "cancelledReason",
] as const;

const TECH_UPDATE_FIELDS = ["status", "resolutionNotes"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      technician: {
        select: { id: true, name: true, email: true, phone: true },
      },
      service: true,
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "We couldn't find that work order." }, { status: 404 });
  }

  return NextResponse.json(workOrder);
}

export async function PATCH(
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

  if (user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Customers can't update work orders." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "We couldn't find that work order." }, { status: 404 });
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `That status isn't valid. Use one of: ${VALID_STATUSES.join(", ")}.` },
        { status: 400 }
      );
    }

    const from = workOrder.status;
    const to = body.status as WorkOrderStatus;

    if (user.role === "TECHNICIAN") {
      if (workOrder.technicianId !== user.userId) {
        return NextResponse.json(
          { error: "You can only update work orders assigned to you." },
          { status: 403 }
        );
      }
      if (!TECHNICIAN_ALLOWED_TARGETS.includes(to)) {
        return NextResponse.json(
          { error: "Technicians can't change a work order to that status." },
          { status: 403 }
        );
      }
    }

    try {
      assertTransition(from, to);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        return NextResponse.json(
          {
            error: "That status change isn't allowed from the current status.",
            from: err.from,
            to: err.to,
            allowed: err.allowed,
          },
          { status: 422 }
        );
      }
      throw err;
    }
  }

  const allowedFields =
    user.role === "TECHNICIAN" ? TECH_UPDATE_FIELDS : ADMIN_UPDATE_FIELDS;

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt as string);
  if (body.status === "CANCELLED" && workOrder.status !== "CANCELLED") {
    data.cancelledAt = new Date();
  }

  const updated = await prisma.workOrder.update({ where: { id }, data });

  if (body.status !== undefined && body.status !== workOrder.status) {
    await logActivity(id, user.userId, "STATUS_CHANGED", workOrder.status, body.status);
  } else if (Object.keys(data).length > 0) {
    await logActivity(id, user.userId, "UPDATED");
  }

  return NextResponse.json(updated);
}
