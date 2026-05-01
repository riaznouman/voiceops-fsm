import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    data.name = body.name.trim();
    data.slug = body.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const updated = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(updated);
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
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.services > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with linked services" },
      { status: 422 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ message: "Category deleted" });
}
