import Link from "next/link";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  href?: string;
}

const cardClasses =
  "flex items-start gap-3 rounded-md border border-gray-300 bg-white p-4 text-inherit no-underline transition-colors hover:border-gray-400 hover:shadow-sm";

export default function StatCard({
  label,
  value,
  icon,
  description,
  href,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-gray-500">
          {label}
        </div>
        <div className="mt-0.5 text-2xl leading-none font-bold text-gray-900">
          {value}
        </div>
        {description && (
          <div className="mt-0.5 text-[11px] text-gray-400">{description}</div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {body}
      </Link>
    );
  }

  return <div className={cardClasses}>{body}</div>;
}
