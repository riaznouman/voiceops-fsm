import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const scheduledAtRaw = searchParams.get("scheduledAt");
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");

  if (!serviceId || !scheduledAtRaw) {
    return NextResponse.json({ error: "serviceId and scheduledAt are required" }, { status: 400 });
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
  }

  const lat = latRaw ? parseFloat(latRaw) : null;
  const lng = lngRaw ? parseFloat(lngRaw) : null;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { serviceSkills: { select: { skillId: true } } },
  });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const requiredSkillIds = service.serviceSkills.map((s) => s.skillId);
  const durationMinutes = service.durationMinutes ?? 60;

  const windowMs = durationMinutes * 60 * 1000;
  const windowStart = new Date(scheduledAt.getTime() - windowMs);
  const windowEnd = new Date(scheduledAt.getTime() + windowMs);

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN", status: "ACTIVE" },
    include: {
      technicianSkills: { select: { skillId: true } },
    },
  });

  const results: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    skills: string[];
    distanceKm: number | null;
  }[] = [];

  for (const tech of technicians) {
    const techSkillIds = tech.technicianSkills.map((ts) => ts.skillId);
    const hasAllSkills = requiredSkillIds.every((id) => techSkillIds.includes(id));
    if (!hasAllSkills) continue;

    const overlapping = await prisma.workOrder.findFirst({
      where: {
        technicianId: tech.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
    });
    if (overlapping) continue;

    let distanceKm: number | null = null;
    if (lat !== null && lng !== null && tech.lat !== null && tech.lng !== null) {
      distanceKm = haversine(lat, lng, tech.lat, tech.lng);
    }

    results.push({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      skills: techSkillIds,
      distanceKm,
    });
  }

  if (lat !== null && lng !== null) {
    results.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return NextResponse.json({ technicians: results });
}
