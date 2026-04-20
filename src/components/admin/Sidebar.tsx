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
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="brand-logo">V</span>
        <span className="brand-name">VoiceOps</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? " nav-item--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">S</div>
        <div className="user-info">
          <div className="user-label">Signed in as</div>
          <div className="user-name">Sarah Johnson</div>
        </div>
      </div>
    </aside>
  );
}
