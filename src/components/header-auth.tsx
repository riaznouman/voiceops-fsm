"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LoaderCircle } from "lucide-react";

function dashboardHrefForRole(role?: string | null) {
  switch (role) {
    case "ADMIN":
    case "MANAGER":
      return "/admin/dashboard";
    case "TECHNICIAN":
      return "/technician/dashboard";
    case "CUSTOMER":
      return "/customer/dashboard";
    default:
      return null;
  }
}

export default function HeaderAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-gray-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
      >
        Sign In
      </Link>
    );
  }

  const dashboardHref = dashboardHrefForRole(session.user.role);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 hidden sm:inline">
        Hi, {session.user.name ?? session.user.email}
      </span>
      {dashboardHref && (
        <Link
          href={dashboardHref}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Dashboard
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 border border-gray-200"
      >
        Sign Out
      </button>
    </div>
  );
}
