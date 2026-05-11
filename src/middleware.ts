import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const ADMIN_ROLES = ["ADMIN", "MANAGER"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isTechnicianRoute = pathname.startsWith("/technician");

  if (!isAdminRoute && !isCustomerRoute && !isTechnicianRoute) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (isAdminRoute && !ADMIN_ROLES.includes(role)) {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(homeUrl);
  }

  if (isCustomerRoute && role !== "CUSTOMER") {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(homeUrl);
  }

  if (isTechnicianRoute && role !== "TECHNICIAN") {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/technician/:path*"],
};
