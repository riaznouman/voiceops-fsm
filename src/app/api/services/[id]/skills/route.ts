import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skills = await prisma.serviceSkill.findMany({
    where: { serviceId: id },
    include: { skill: true },
  });
  return NextResponse.json(skills);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const body = await request.json();
  const { skillId } = body;

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }

  const existing = await prisma.serviceSkill.findUnique({
    where: { serviceId_skillId: { serviceId: id, skillId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Skill already assigned to this service" }, { status: 422 });
  }

  const record = await prisma.serviceSkill.create({
    data: { serviceId: id, skillId },
    include: { skill: true },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const body = await request.json();
  const { skillId } = body;

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }

  const existing = await prisma.serviceSkill.findUnique({
    where: { serviceId_skillId: { serviceId: id, skillId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Skill not assigned to this service" }, { status: 404 });
  }

  await prisma.serviceSkill.delete({
    where: { serviceId_skillId: { serviceId: id, skillId } },
  });

  return NextResponse.json({ message: "Skill removed from service" });
}
