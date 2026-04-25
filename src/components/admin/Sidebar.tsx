"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Work Orders", href: "/admin/work-orders" },
  { label: "Technicians", href: "/admin/technicians" },
  { label: "Services", href: "/admin/services" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Settings", href: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-gray-800">
      <div className="flex items-center gap-2.5 border-b border-gray-700 px-4 pt-5 pb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-base font-bold text-white">
          V
        </span>
        <span className="text-base font-bold tracking-tight text-gray-50">
          VoiceOps
        </span>
      </div>

      <nav className="flex flex-1 flex-col py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const stateClasses = isActive
            ? "border-blue-600 bg-gray-700 font-semibold text-white"
            : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-50";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block border-l-[3px] px-4 py-2.5 text-sm transition-colors ${stateClasses}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-gray-700 bg-gray-900 px-4 py-3.5">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gray-700 text-[13px] font-bold text-gray-400">
          S
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.05em] text-gray-500">
            Signed in as
          </div>
          <div className="truncate text-[13px] text-gray-300">
            Sarah Johnson
          </div>
        </div>
      </div>
    </aside>
  );
}
