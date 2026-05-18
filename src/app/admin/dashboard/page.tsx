"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  UserCheck,
  Users,
} from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";

function StatCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-gray-200" />
      <div className="min-w-0 flex-1">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-6 w-12 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function MiniStatSkeleton() {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 text-center">
      <div className="mx-auto h-5 w-8 animate-pulse rounded bg-gray-200" />
      <div className="mx-auto mt-2 h-2.5 w-14 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

interface DashboardStats {
  totalWorkOrders: number;
  byStatus: {
    PENDING: number;
    EN_ROUTE: number;
    ON_SITE: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  todayJobs: number;
  activeTechnicians: number;
  unassignedJobs: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    STATUS_CHANGE: <CheckCircle size={14} className="text-green-500" />,
    ASSIGNMENT: <UserCheck size={14} className="text-blue-500" />,
    NOTE: <Briefcase size={14} className="text-gray-400" />,
    VOICE_CALL: <Phone size={14} className="text-purple-500" />,
  };
  return <>{icons[type] ?? <Clock size={14} className="text-gray-400" />}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [callsToday, setCallsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => {
        if (!r.ok) throw new Error("stats");
        return r.json();
      }),
      fetch("/api/voice/stats")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([s, voice]) => {
        setStats(s);
        if (voice && typeof voice.callsToday === "number") {
          setCallsToday(voice.callsToday);
        }
      })
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Loading your overview…</p>
          </div>
        </div>
        <h2 className="mt-6 mb-3 text-base font-semibold text-gray-900">Work Orders</h2>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <h2 className="mt-6 mb-3 text-base font-semibold text-gray-900">Status Breakdown</h2>
        <div className="mb-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MiniStatSkeleton key={i} />
          ))}
        </div>
        <h2 className="mt-6 mb-3 text-base font-semibold text-gray-900">Team</h2>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <section className="rounded-md border border-gray-300 bg-white p-5">
          <h2 className="mb-3 border-b border-gray-200 pb-2.5 text-[15px] font-semibold text-gray-900">
            Recent Activity
          </h2>
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-gray-200" />
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "No data available."}
      </div>
    );
  }

  const sectionHeading = "mt-6 mb-3 text-base font-semibold text-gray-900";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here's your operational overview.
          </p>
        </div>
        <Link
          href="/admin/work-orders/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New Work Order
        </Link>
      </div>

      <h2 className={sectionHeading}>Work Orders</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.totalWorkOrders}
          icon={<Calendar size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Today's Jobs"
          value={stats.todayJobs}
          icon={<Briefcase size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Pending"
          value={stats.byStatus.PENDING}
          icon={<Clock size={18} />}
          href="/admin/work-orders?status=PENDING"
        />
        <StatCard
          label="Unassigned"
          value={stats.unassignedJobs}
          icon={<UserCheck size={18} />}
          href="/admin/work-orders?status=PENDING"
        />
      </div>

      <h2 className={sectionHeading}>Status Breakdown</h2>
      <div className="mb-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
        {(
          [
            ["EN_ROUTE", "En Route", "text-blue-600"],
            ["ON_SITE", "On Site", "text-indigo-600"],
            ["IN_PROGRESS", "In Progress", "text-purple-600"],
            ["COMPLETED", "Completed", "text-green-600"],
            ["CANCELLED", "Cancelled", "text-red-600"],
          ] as [keyof DashboardStats["byStatus"], string, string][]
        ).map(([key, label, cls]) => (
          <div
            key={key}
            className="rounded-md border border-gray-200 bg-white p-3 text-center"
          >
            <div className={`text-xl font-bold ${cls}`}>{stats.byStatus[key]}</div>
            <div className="mt-0.5 text-[11px] text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <h2 className={sectionHeading}>Team</h2>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard
          label="Active Technicians"
          value={stats.activeTechnicians}
          icon={<Users size={18} />}
          href="/admin/technicians"
        />
        <StatCard
          label="Calls Today"
          value={callsToday}
          icon={<Phone size={18} />}
          href="/admin/calls"
        />
      </div>

      <section className="rounded-md border border-gray-300 bg-white p-5">
        <h2 className="mb-3 border-b border-gray-200 pb-2.5 text-[15px] font-semibold text-gray-900">
          Recent Activity
        </h2>
        {stats.recentActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No recent activity.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.recentActivity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5">
                  <ActivityIcon type={item.type} />
                </span>
                <span className="flex-1 text-gray-700">{item.message}</span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
