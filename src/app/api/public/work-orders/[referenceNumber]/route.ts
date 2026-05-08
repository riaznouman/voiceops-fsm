import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ referenceNumber: string }> }
) {
  const { referenceNumber } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { referenceNumber },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } },
      technician: { select: { name: true } },
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const customerFirstName = workOrder.customer.name.split(" ")[0];
  const technicianFirstName = workOrder.technician?.name.split(" ")[0] ?? null;

  return NextResponse.json({
    referenceNumber: workOrder.referenceNumber,
    status: workOrder.status,
    scheduledAt: workOrder.scheduledAt,
    customerFirstName,
    serviceName: workOrder.service?.name ?? null,
    technicianFirstName,
  });
}
