"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "Notifications", href: "/customer/notifications" },
  { label: "Settings", href: "/customer/settings/profile" },
];

export default function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 border-b border-gray-200">
      {items.map((it) => {
        const isActive =
          pathname === it.href ||
          (it.href.endsWith("/profile") && pathname.startsWith("/customer/settings"));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
