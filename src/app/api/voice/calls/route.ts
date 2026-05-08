import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const pageSize = isNaN(pageSizeRaw) || pageSizeRaw < 1 ? 20 : pageSizeRaw;

  const [total, data] = await Promise.all([
    prisma.callSession.count(),
    prisma.callSession.findMany({
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fromNumber: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
        summary: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ data, page, pageSize, total });
}
