"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, LoaderCircle, Mic, PhoneOff, Timer } from "lucide-react";

interface VoiceStats {
  callsToday: number;
  successRate: number;
  avgDurationSec: number;
  abandonedCount: number;
}

interface RecentCall {
  id: string;
  fromNumber: string;
  startedAt: string;
  durationSec: number | null;
  status: string;
  summary?: string | null;
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function formatDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
};

export default function VoiceAgentPage() {
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/voice/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/voice/calls?pageSize=10")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => (Array.isArray(d) ? d : d.data ?? [])),
    ])
      .then(([s, calls]) => { setStats(s); setRecentCalls(calls); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Voice Agent</h1>
        <p className="text-sm text-gray-500">AI receptionist performance overview</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBlock
          label="Calls today"
          value={String(stats?.callsToday ?? 0)}
          icon={<Mic size={16} />}
        />
        <StatBlock
          label="Success rate"
          value={`${stats?.successRate ?? 0}%`}
          icon={<CheckCircle size={16} />}
        />
        <StatBlock
          label="Avg duration"
          value={formatDuration(stats?.avgDurationSec ?? null)}
          icon={<Timer size={16} />}
        />
        <StatBlock
          label="Abandoned"
          value={String(stats?.abandonedCount ?? 0)}
          icon={<PhoneOff size={16} />}
        />
      </div>

      <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Recent Calls</h2>
          <Link href="/admin/calls" className="text-xs font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {recentCalls.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">No calls yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["From", "Started", "Duration", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100">{c.fromNumber}</td>
                  <td className="px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100">{new Date(c.startedAt).toLocaleString()}</td>
                  <td className="px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100">{formatDuration(c.durationSec)}</td>
                  <td className="px-3 py-3 text-[13px] border-b border-gray-100">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[13px] border-b border-gray-100">
                    <Link href={`/admin/calls/${c.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
