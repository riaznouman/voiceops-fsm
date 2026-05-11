import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

const ROLES = ["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"] as const;
type Role = (typeof ROLES)[number];

export async function GET(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  if (!["ADMIN", "MANAGER"].includes(me.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const search = searchParams.get("search")?.trim() ?? "";
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);

  const where: {
    role?: Role;
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
  } = {};
  if (roleParam && ROLES.includes(roleParam as Role)) {
    where.role = roleParam as Role;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}
