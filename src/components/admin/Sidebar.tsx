"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

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
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const userRole = session?.user?.role ?? "";
  const initial = userName.charAt(0).toUpperCase() || "?";

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

      <div className="relative border-t border-gray-700" ref={menuRef}>
        {menuOpen && (
          <div className="absolute right-2 bottom-full left-2 mb-2 overflow-hidden rounded-md border border-gray-200 bg-white text-sm shadow-lg">
            <div className="px-3 py-2 text-xs text-gray-500">
              <div className="truncate">{userEmail}</div>
            </div>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 bg-gray-900 px-4 py-3.5 text-left transition-colors hover:bg-black/30"
        >
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gray-700 text-[13px] font-bold text-gray-200">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.05em] text-gray-500">
              Signed in as
            </div>
            <div className="truncate text-[13px] text-gray-300">
              {userName || "—"}
            </div>
            {userRole && (
              <span className="mt-1 inline-block rounded border border-blue-700 bg-blue-700/30 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-blue-200 uppercase">
                {userRole}
              </span>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}
