import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id },
    include: { category: true, serviceSkills: { include: { skill: true } } },
  });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  return NextResponse.json(service);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(["ADMIN", "MANAGER"], request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, basePrice, durationMinutes, isActive, categoryId } = body;

  if (basePrice !== undefined && (typeof basePrice !== "number" || basePrice < 0)) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name.trim();
    data.slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  if (description !== undefined) data.description = description;
  if (basePrice !== undefined) data.basePrice = basePrice;
  if (durationMinutes !== undefined) data.durationMinutes = durationMinutes;
  if (isActive !== undefined) data.isActive = isActive;
  if (categoryId !== undefined) data.categoryId = categoryId;

  const updated = await prisma.service.update({
    where: { id },
    data,
    include: { category: true },
  });
  return NextResponse.json(updated);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(["ADMIN", "MANAGER"], request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ message: "Service deleted" });
}
