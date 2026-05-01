import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

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

  const existing = await prisma.technicianSkill.findUnique({
    where: { userId_skillId: { userId: id, skillId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Skill already assigned to this technician" }, { status: 422 });
  }

  const record = await prisma.technicianSkill.create({
    data: { userId: id, skillId },
    include: { skill: true },
  });

  return NextResponse.json(record, { status: 201 });
}
