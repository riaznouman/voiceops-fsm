import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

const ROLES = ["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"] as const;
const STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"] as const;

type Role = (typeof ROLES)[number];
type Status = (typeof STATUSES)[number];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  if (!["ADMIN", "MANAGER"].includes(me.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  if (me.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only ADMIN can change roles or status" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const data: { role?: Role; status?: Status } = {};

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${ROLES.join(", ")}` },
        { status: 400 }
      );
    }
    if (id === me.userId && body.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot demote your own admin account." },
        { status: 400 }
      );
    }
    data.role = body.role;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    if (id === me.userId && body.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
