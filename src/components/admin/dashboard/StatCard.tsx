import Link from "next/link";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  href?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  description,
  href,
}: StatCardProps) {
  const body = (
    <>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-number">{value}</div>
        {description && <div className="stat-desc">{description}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card">
        {body}
      </Link>
    );
  }

  return <div className="stat-card">{body}</div>;
}
