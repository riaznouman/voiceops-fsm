import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
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

  const { id, skillId } = await params;

  const existing = await prisma.technicianSkill.findUnique({
    where: { userId_skillId: { userId: id, skillId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Skill assignment not found" }, { status: 404 });
  }

  await prisma.technicianSkill.delete({
    where: { userId_skillId: { userId: id, skillId } },
  });

  return NextResponse.json({ message: "Skill removed from technician" });
}
