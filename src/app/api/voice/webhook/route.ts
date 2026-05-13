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

type ToolInvocation = {
  id?: string;
  name?: string;
  parameters: Record<string, unknown>;
};

function extractInvocations(message: Record<string, unknown>): ToolInvocation[] {
  // Modern Vapi: message.toolCalls = [{ id, function: { name, arguments } }]
  // where arguments is a JSON string.
  const toolCalls = message.toolCalls as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    return toolCalls.map((tc) => {
      const fn = tc.function as Record<string, unknown> | undefined;
      let args = fn?.arguments as unknown;
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      return {
        id: tc.id as string | undefined,
        name: fn?.name as string | undefined,
        parameters: (args as Record<string, unknown>) ?? {},
      };
    });
  }
  // Legacy Vapi: message.functionCall = { name, parameters }
  const fc = message.functionCall as Record<string, unknown> | undefined;
  if (fc) {
    return [
      {
        name: fc.name as string | undefined,
        parameters: (fc.parameters as Record<string, unknown>) ?? {},
      },
    ];
  }
  return [];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const reqId = Math.random().toString(36).slice(2, 8);

  if (process.env.NODE_ENV !== "development") {
    if (!verifyBearerToken(request)) {
      console.warn("[VAPI]", reqId, "auth failed", {
        hasAuthHeader: !!request.headers.get("authorization"),
        tokenConfigured: !!process.env.VAPI_WEBHOOK_TOKEN,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("[VAPI]", reqId, "invalid json", {
      bodyPreview: rawBody.slice(0, 200),
      err: String(err),
    });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Modern Vapi nests everything under `message`. Legacy put fields at the top.
  const message = ((payload.message as Record<string, unknown>) ?? payload) as Record<string, unknown>;
  const type = (message.type as string) ?? (payload.event as string) ?? "unknown";
  const call = (message.call as Record<string, unknown> | undefined) ?? (payload.call as Record<string, unknown> | undefined);
  const callId = call?.id as string | undefined;

  console.log("[VAPI]", reqId, "type:", type, "callId:", callId ?? null);
  console.log("[VAPI:raw]", reqId, "topKeys:", Object.keys(payload).join(","), "messageKeys:", Object.keys(message).join(","));
  console.log("[VAPI:body]", reqId, rawBody.length > 4000 ? rawBody.slice(0, 4000) + "...(truncated)" : rawBody);

  // --- Call lifecycle: start ----------------------------------------------
  if (type === "status-update" || type === "call.started") {
    const status = message.status as string | undefined;
    const isStart = type === "call.started" || status === "in-progress";
    if (isStart && callId) {
      const customer = message.customer as Record<string, unknown> | undefined;
      const callCustomer = call?.customer as Record<string, unknown> | undefined;
      const callType = (call?.type as string) ?? "";
      const isWebCall = callType.toLowerCase().includes("web");
      const fromNumber =
        (customer?.number as string) ??
        (callCustomer?.number as string) ??
        (call?.from as string) ??
        (isWebCall ? "Web Test" : null);
      const startedAt = call?.startedAt
        ? new Date(call.startedAt as string)
        : new Date();
      // Upsert so we don't depend on the start event arriving first.
      await prisma.callSession.upsert({
        where: { id: callId },
        create: { id: callId, fromNumber, startedAt },
        update: { fromNumber, startedAt },
      });
      console.log("[VAPI]", reqId, "call session upserted on start");
    }
    return NextResponse.json({ status: "ok" });
  }

  // --- Call lifecycle: end ------------------------------------------------
  if (type === "end-of-call-report" || type === "call.ended" || type === "hang") {
    if (callId) {
      const endedAt = call?.endedAt ? new Date(call.endedAt as string) : new Date();
      // Vapi sometimes sends durationSeconds as a number, sometimes as a string.
      // Explicit Number() coercion handles both.
      const rawDuration =
        (message.durationSeconds as number | string | undefined) ??
        (message.duration as number | string | undefined) ??
        (call?.duration as number | string | undefined);
      const parsedDuration =
        rawDuration !== undefined && rawDuration !== null
          ? Number(rawDuration)
          : NaN;
      const durationSec = Number.isFinite(parsedDuration) ? Math.round(parsedDuration) : null;
      const summary =
        (message.summary as string) ??
        (call?.summary as string) ??
        null;

      // Upsert so the end-of-call data is saved even if we missed the start.
      await prisma.callSession.upsert({
        where: { id: callId },
        create: { id: callId, endedAt, durationSec, summary, startedAt: endedAt },
        update: { endedAt, durationSec, summary },
      });
      console.log("[VAPI]", reqId, "call session closed", { durationSec, hasSummary: !!summary });
    }
    return NextResponse.json({ status: "ok" });
  }

  // --- Transcript ---------------------------------------------------------
  if (type === "transcript") {
    if (callId) {
      const role = (message.role as string) ?? "unknown";
      const content =
        (message.transcript as string) ??
        (message.content as string) ??
        "";
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

  // --- Tool calls (function calls) ----------------------------------------
  if (type === "tool-calls" || type === "function-call") {
    const invocations = extractInvocations(message);
    if (invocations.length === 0) {
      console.warn("[VAPI]", reqId, "no invocations in", type);
      return NextResponse.json({ error: "No tool calls" }, { status: 400 });
    }

    const results: Array<{ toolCallId?: string; result: unknown }> = [];

    for (const inv of invocations) {
      const { id: toolCallId, name: toolName, parameters } = inv;
      if (!toolName) {
        console.warn("[VAPI]", reqId, "invocation missing name");
        results.push({ toolCallId, result: { error: "Missing function name" } });
        continue;
      }

      console.log("[VAPI]", reqId, "tool:", toolName, "params:", JSON.stringify(parameters));

      try {
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
            parameters.address as string,
            (parameters.customerId as string | undefined) ?? null
          );
        } else if (toolName === "get_customer") {
          result = await get_customer(parameters.phone as string);
        } else {
          console.warn("[VAPI]", reqId, "unknown tool:", toolName);
          results.push({ toolCallId, result: { error: `Unknown tool: ${toolName}` } });
          continue;
        }
        console.log("[VAPI]", reqId, "tool ok:", toolName, "result:", JSON.stringify(result));
        results.push({ toolCallId, result });
      } catch (err) {
        console.error("[VAPI]", reqId, "tool failed:", toolName, err);
        results.push({ toolCallId, result: { error: String(err) } });
      }
    }

    // Vapi expects result as a string in the tool-calls response so the LLM can
    // consume it as text. If we hand back a raw object it silently drops the
    // turn and the call goes dead.
    const stringified = results.map((r) => ({
      toolCallId: r.toolCallId,
      result: typeof r.result === "string" ? r.result : JSON.stringify(r.result),
    }));

    if (type === "tool-calls") {
      return NextResponse.json({ results: stringified });
    }
    return NextResponse.json({ result: stringified[0]?.result });
  }

  // Other types (speech-update, conversation-update, etc.) — ack and ignore.
  console.log("[VAPI]", reqId, "unhandled type:", type);
  return NextResponse.json({ status: "ok" });
}
