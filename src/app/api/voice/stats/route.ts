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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCalls = await prisma.callSession.findMany({
    where: { startedAt: { gte: todayStart, lte: todayEnd } },
    select: { durationSec: true, endedAt: true, summary: true },
  });

  const totalCallsToday = todayCalls.length;

  const successfulCalls = todayCalls.filter(
    (c) => c.durationSec !== null && c.durationSec > 60 && c.summary !== null
  );
  const successRate =
    totalCallsToday > 0 ? successfulCalls.length / totalCallsToday : 0;

  const completedCalls = todayCalls.filter((c) => c.durationSec !== null && c.endedAt !== null);
  const totalDuration = completedCalls.reduce((sum, c) => sum + (c.durationSec ?? 0), 0);
  const avgDurationSec =
    completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;

  const abandonedCount = todayCalls.filter(
    (c) => c.durationSec === null || c.durationSec < 30 || c.endedAt === null
  ).length;

  return NextResponse.json({
    callsToday: totalCallsToday,
    successRate: Math.round(successRate * 100) / 100,
    avgDurationSec,
    abandonedCount,
  });
}
