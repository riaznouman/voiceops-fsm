import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET() {
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(skills);
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
  const { name, description } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const skill = await prisma.skill.create({
    data: { name: name.trim(), description: description ?? null },
  });

  return NextResponse.json(skill, { status: 201 });
}
