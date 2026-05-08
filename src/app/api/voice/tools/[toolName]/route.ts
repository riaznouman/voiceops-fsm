import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-guard";
import { check_availability, create_booking, get_customer } from "@/lib/voice-tools";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ toolName: string }> }
) {
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

  const { toolName } = await params;
  const body = await request.json();

  let result: unknown;

  if (toolName === "check_availability") {
    result = await check_availability(body.date, body.serviceType);
  } else if (toolName === "create_booking") {
    result = await create_booking(
      body.customerName,
      body.customerPhone,
      body.serviceId,
      body.scheduledAt,
      body.address
    );
  } else if (toolName === "get_customer") {
    result = await get_customer(body.phone);
  } else {
    return NextResponse.json({ error: `Unknown tool: ${toolName}` }, { status: 404 });
  }

  return NextResponse.json({ result });
}
