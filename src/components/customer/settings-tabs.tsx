"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Profile", href: "/customer/settings/profile" },
  { label: "Password", href: "/customer/settings/password" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <aside className="w-full md:w-48 shrink-0">
      <ul className="flex md:flex-col gap-1 text-sm">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`block rounded-md px-3 py-2 ${
                  active
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
