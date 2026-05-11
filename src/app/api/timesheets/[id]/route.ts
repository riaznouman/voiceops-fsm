import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

async function loadOwnTimesheet(id: string, userId: string, role: string) {
  const ts = await prisma.timesheet.findUnique({ where: { id } });
  if (!ts) return { error: "Not found", status: 404 } as const;
  const isOwner = ts.userId === userId;
  const isAdmin = ["ADMIN", "MANAGER"].includes(role);
  if (!isOwner && !isAdmin) return { error: "Forbidden", status: 403 } as const;
  return { timesheet: ts } as const;
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
  const r = await loadOwnTimesheet(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r.timesheet);
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
  const r = await loadOwnTimesheet(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await request.json();
  const data: { date?: Date; hoursWorked?: number; notes?: string | null; workOrderId?: string | null } = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.hoursWorked !== undefined) {
    if (typeof body.hoursWorked !== "number" || body.hoursWorked <= 0 || body.hoursWorked > 24) {
      return NextResponse.json(
        { error: "hoursWorked must be between 0 and 24" },
        { status: 400 }
      );
    }
    data.hoursWorked = body.hoursWorked;
  }
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.workOrderId !== undefined) data.workOrderId = body.workOrderId || null;

  const updated = await prisma.timesheet.update({ where: { id }, data });
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
  const r = await loadOwnTimesheet(id, me.userId, me.role);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  await prisma.timesheet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
