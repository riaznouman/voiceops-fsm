import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import type { InvoiceStatus, Prisma } from "@prisma/client";

const VALID_STATUSES: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "CANCELLED"];

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const pageSize = isNaN(pageSizeRaw) || pageSizeRaw < 1 ? 20 : pageSizeRaw;

  if (status && !VALID_STATUSES.includes(status as InvoiceStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.InvoiceWhereInput = {};
  if (status) where.status = status as InvoiceStatus;
  if (customerId) where.customerId = customerId;

  const [total, data] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data, page, pageSize, total });
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { workOrderId, customerId, dueDate, notes, lineItems } = body;

  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
  }

  const processedItems = lineItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxRate = 0.1;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const count = await prisma.invoice.count();
  const referenceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      referenceNumber,
      customerId,
      workOrderId: workOrderId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      subtotal,
      taxRate,
      taxAmount,
      total,
      lineItems: {
        create: processedItems,
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lineItems: true,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
