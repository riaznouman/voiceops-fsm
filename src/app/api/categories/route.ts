import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { services: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { name, description, isActive } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Category with this name already exists" }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description ?? null,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
