import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/work-orders - list work orders
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workOrders = await prisma.workOrder.findMany({
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      technician: {
        select: { id: true, name: true, email: true },
      },
      service: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workOrders);
}

// POST /api/work-orders - create a new work order
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, serviceId, priority, scheduledAt, address, issueDescription } = body;

  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  // generate reference number
  const count = await prisma.workOrder.count();
  const referenceNumber = `VO-${String(count + 1).padStart(5, "0")}`;

  const workOrder = await prisma.workOrder.create({
    data: {
      referenceNumber,
      customerId,
      serviceId,
      priority: priority || "NORMAL",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      address,
      issueDescription,
    },
  });

  return NextResponse.json(workOrder, { status: 201 });
}
