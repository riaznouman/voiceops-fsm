import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractToken } from "@/lib/auth-guard";

const PHONE_REGEX = /^[0-9+\-\s()]+$/;

export async function GET(request: NextRequest) {
  let payload;
  try {
    payload = extractToken(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
      technicianSkills: {
        include: { skill: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  let payload;
  try {
    payload = extractToken(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await request.json();
  const data: { name?: string; phone?: string | null } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return NextResponse.json({ error: "Name must be a string" }, { status: 400 });
    }
    const trimmed = body.name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
    }
    data.name = trimmed;
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else if (typeof body.phone !== "string") {
      return NextResponse.json({ error: "Phone must be a string" }, { status: 400 });
    } else {
      const trimmed = body.phone.trim();
      if (trimmed.length > 20) {
        return NextResponse.json({ error: "Phone must be 20 characters or fewer" }, { status: 400 });
      }
      if (!PHONE_REGEX.test(trimmed)) {
        return NextResponse.json(
          { error: "Phone may only contain digits, spaces, +, -, ( and )" },
          { status: 400 }
        );
      }
      data.phone = trimmed;
    }
  }

  const updated = await prisma.user.update({
    where: { id: payload.sub },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
