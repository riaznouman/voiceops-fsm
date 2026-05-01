import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";

export async function PUT(
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { technicianId } = body;

  if (!technicianId) {
    return NextResponse.json({ error: "technicianId is required" }, { status: 400 });
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      service: { include: { serviceSkills: { select: { skillId: true } } } },
    },
  });
  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (workOrder.service && workOrder.service.serviceSkills.length > 0) {
    const requiredSkillIds = workOrder.service.serviceSkills.map((s) => s.skillId);
    const techSkills = await prisma.technicianSkill.findMany({
      where: { userId: technicianId },
      select: { skillId: true },
    });
    const techSkillIds = techSkills.map((ts) => ts.skillId);
    const missingSkills = requiredSkillIds.filter((sid) => !techSkillIds.includes(sid));
    if (missingSkills.length > 0) {
      return NextResponse.json(
        { error: "Technician does not have all required skills for this service", missingSkills },
        { status: 422 }
      );
    }
  }

  const prevTechnicianId = workOrder.technicianId;

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { technicianId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true } },
    },
  });

  await logActivity(
    id,
    user.userId,
    "ASSIGNED",
    prevTechnicianId ?? undefined,
    technicianId
  );

  await notify(
    technicianId,
    "ASSIGNMENT",
    "New job assigned",
    `Work order ${workOrder.referenceNumber} has been assigned to you`,
    `/admin/work-orders/${id}`
  );

  return NextResponse.json(updated);
}
