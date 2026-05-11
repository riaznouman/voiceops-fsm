import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

async function loadOwnExpense(id: string, userId: string, role: string) {
  const e = await prisma.expense.findUnique({ where: { id } });
  if (!e) return { error: "Not found", status: 404 } as const;
  const isOwner = e.userId === userId;
  const isAdmin = ["ADMIN", "MANAGER"].includes(role);
  if (!isOwner && !isAdmin) return { error: "Forbidden", status: 403 } as const;
  return { expense: e } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const { id } = await params;
  const r = await loadOwnExpense(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r.expense);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const { id } = await params;
  const r = await loadOwnExpense(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await request.json();
  const data: {
    date?: Date;
    description?: string;
    amount?: number;
    workOrderId?: string | null;
  } = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
    }
    data.amount = body.amount;
  }
  if (body.workOrderId !== undefined) data.workOrderId = body.workOrderId || null;

  const updated = await prisma.expense.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const { id } = await params;
  const r = await loadOwnExpense(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
