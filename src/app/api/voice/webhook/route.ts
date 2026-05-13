import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { check_availability, create_booking, get_customer } from "@/lib/voice-tools";

function verifyBearerToken(request: NextRequest): boolean {
  const token = process.env.VAPI_WEBHOOK_TOKEN;
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return match[1].trim() === token;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (process.env.NODE_ENV !== "development") {
    if (!verifyBearerToken(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event as string;
  const call = payload.call as Record<string, unknown> | undefined;
  const message = payload.message as Record<string, unknown> | undefined;

  if (event === "call.started") {
    const callId = (call?.id as string) ?? undefined;
    const fromNumber = (call?.from as string) ?? null;
    const startedAt = call?.startedAt ? new Date(call.startedAt as string) : new Date();

    const existing = callId
      ? await prisma.callSession.findUnique({ where: { id: callId } })
      : null;

    if (!existing) {
      await prisma.callSession.create({
        data: {
          ...(callId ? { id: callId } : {}),
          fromNumber,
          startedAt,
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  }

  if (event === "call.ended") {
    const callId = call?.id as string | undefined;
    if (callId) {
      const endedAt = call?.endedAt ? new Date(call.endedAt as string) : new Date();
      const durationSec = call?.duration ? Math.round(call.duration as number) : null;
      const summary = (call?.summary as string) ?? null;

      const existing = await prisma.callSession.findUnique({ where: { id: callId } });
      if (existing) {
        await prisma.callSession.update({
          where: { id: callId },
          data: { endedAt, durationSec, summary },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  }

  if (event === "transcript") {
    const callId = call?.id as string | undefined;
    const role = (message?.role as string) ?? "unknown";
    const content = (message?.content as string) ?? "";

    if (callId) {
      const session = await prisma.callSession.findUnique({ where: { id: callId } });
      if (session) {
        const existing = Array.isArray(session.transcript) ? session.transcript : [];
        const updated = [...existing, { role, content }];
        await prisma.callSession.update({
          where: { id: callId },
          data: { transcript: updated },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  }

  if (event === "function-call") {
    const functionCall = message?.functionCall as Record<string, unknown> | undefined;
    const toolName = functionCall?.name as string | undefined;
    const parameters = (functionCall?.parameters as Record<string, unknown>) ?? {};

    if (!toolName) {
      return NextResponse.json({ error: "Missing function name" }, { status: 400 });
    }

    let result: unknown;

    if (toolName === "check_availability") {
      result = await check_availability(
        parameters.date as string,
        parameters.serviceType as string
      );
    } else if (toolName === "create_booking") {
      result = await create_booking(
        parameters.customerName as string,
        parameters.customerPhone as string,
        parameters.serviceId as string,
        parameters.scheduledAt as string,
        parameters.address as string
      );
    } else if (toolName === "get_customer") {
      result = await get_customer(parameters.phone as string);
    } else {
      return NextResponse.json({ error: `Unknown tool: ${toolName}` }, { status: 400 });
    }

    return NextResponse.json({ result });
  }

  return NextResponse.json({ status: "ok" });
}
