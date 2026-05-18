import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { notify } from "@/lib/notify";
import type { InvoiceStatus } from "@prisma/client";

const VALID_STATUSES: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "CANCELLED"];

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

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to manage invoices." }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lineItems: true,
      workOrder: {
        select: { id: true, referenceNumber: true, status: true, scheduledAt: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "We couldn't find that invoice." }, { status: 404 });
  }

  return NextResponse.json(invoice);
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

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to manage invoices." }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "We couldn't find that invoice." }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Please choose a valid invoice status." }, { status: 400 });
  }

  const data: Record<string, unknown> = { status };
  if (status === "PAID" && invoice.status !== "PAID") {
    data.paidAt = new Date();
  }

  const updated = await prisma.invoice.update({ where: { id }, data });

  if (status !== invoice.status) {
    if (status === "SENT") {
      await notify(
        invoice.customerId,
        "INVOICE_SENT",
        "New invoice",
        `Invoice ${invoice.referenceNumber} has been issued for $${invoice.total.toFixed(2)}.`,
        `/customer/invoices/${id}`
      );
    } else if (status === "PAID") {
      await notify(
        invoice.customerId,
        "INVOICE_PAID",
        "Payment received",
        `Thanks — we've recorded payment for invoice ${invoice.referenceNumber}.`,
        `/customer/invoices/${id}`
      );
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
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

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "You don't have permission to manage invoices." }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "We couldn't find that invoice." }, { status: 404 });
  }

  if (invoice.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft invoices can be deleted." },
      { status: 422 }
    );
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ message: "Invoice deleted" });
}
