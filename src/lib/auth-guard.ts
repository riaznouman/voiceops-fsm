import { verify } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

interface TokenPayload {
  sub: string;
  role: string;
}

export interface CurrentUser {
  userId: string;
  role: string;
}

export function extractToken(request: NextRequest): TokenPayload {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw { status: 401, message: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
    return { sub: payload.sub, role: payload.role };
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export function requireRole(roles: string[], request: NextRequest): TokenPayload {
  const payload = extractToken(request);
  if (!roles.includes(payload.role)) {
    throw { status: 403, message: "Insufficient permissions" };
  }
  return payload;
}

// Auth via Bearer token (mobile) or NextAuth session (admin panel)
export async function getCurrentUser(request: NextRequest): Promise<CurrentUser> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = extractToken(request);
    return { userId: payload.sub, role: payload.role };
  }

  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, role: session.user.role };
  }

  throw { status: 401, message: "Unauthorized" };
}
