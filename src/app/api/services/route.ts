import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET() {
  const services = await prisma.service.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  try {
    requireRole(["ADMIN", "MANAGER"], request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await request.json();
  const { name, description, basePrice, durationMinutes, isActive, categoryId } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (basePrice !== undefined && (typeof basePrice !== "number" || basePrice < 0)) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.service.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A service with this name already exists" }, { status: 409 });
  }

  const service = await prisma.service.create({
    data: {
      name: name.trim(),
      slug,
      description: description ?? null,
      basePrice: basePrice ?? null,
      durationMinutes: durationMinutes ?? null,
      isActive: typeof isActive === "boolean" ? isActive : true,
      categoryId: categoryId ?? null,
    },
    include: { category: true },
  });

  return NextResponse.json(service, { status: 201 });
}
