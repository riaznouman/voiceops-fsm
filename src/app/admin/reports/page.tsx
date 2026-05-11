"use client";

import { useEffect, useState, useCallback } from "react";
import { LoaderCircle } from "lucide-react";

interface ReportData {
  range: { from: string; to: string };
  summary: {
    total: number;
    completed: number;
    completionRate: number;
    avgCompletionHours: number | null;
  };
  byStatus: Record<string, number>;
  perTechnician: Array<{ technicianId: string | null; name: string; completed: number }>;
  perService: Array<{ serviceId: string | null; name: string; total: number }>;
}

const STATUSES = ["PENDING", "EN_ROUTE", "ON_SITE", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500",
  EN_ROUTE: "bg-blue-500",
  ON_SITE: "bg-indigo-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-gray-400",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: isoDate(from), to: isoDate(to) };
}

export default function ReportsPage() {
  const last7 = presetRange(7);
  const [from, setFrom] = useState(last7.from);
  const [to, setTo] = useState(last7.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((f: string, t: string) => {
    setLoading(true);
    setError("");
    fetch(`/api/reports?from=${f}&to=${t}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(from, to);
  }, [from, to, load]);

  function applyPreset(days: number) {
    const r = presetRange(days);
    setFrom(r.from);
    setTo(r.to);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">
          Operational summary for a chosen period.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="ml-2 flex gap-1">
          {[
            { label: "7d", days: 7 },
            { label: "30d", days: 30 },
            { label: "90d", days: 90 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.days)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : data ? (
        <>
          <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Total work orders" value={String(data.summary.total)} />
            <KpiCard label="Completed" value={String(data.summary.completed)} />
            <KpiCard
              label="Completion rate"
              value={`${(data.summary.completionRate * 100).toFixed(1)}%`}
            />
            <KpiCard
              label="Avg cycle time"
              value={
                data.summary.avgCompletionHours !== null
                  ? `${data.summary.avgCompletionHours.toFixed(1)} h`
                  : "—"
              }
            />
          </section>

          <section className="mb-6 rounded-md border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Status breakdown</h2>
            <div className="space-y-2">
              {STATUSES.map((s) => {
                const count = data.byStatus[s] ?? 0;
                const pct = data.summary.total > 0 ? (count / data.summary.total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-medium text-gray-600">
                      {s.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-4 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full ${STATUS_COLORS[s]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-semibold text-gray-700">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-md border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Top technicians (completed)
              </h2>
              {data.perTechnician.length === 0 ? (
                <p className="text-sm text-gray-500">No completed jobs in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.perTechnician.map((t) => (
                    <li
                      key={t.technicianId ?? t.name}
                      className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm last:border-b-0"
                    >
                      <span className="text-gray-800">{t.name}</span>
                      <span className="font-semibold text-gray-900">{t.completed}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-md border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Top services (jobs raised)
              </h2>
              {data.perService.length === 0 ? (
                <p className="text-sm text-gray-500">No data in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.perService.map((s) => (
                    <li
                      key={s.serviceId ?? s.name}
                      className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm last:border-b-0"
                    >
                      <span className="text-gray-800">{s.name}</span>
                      <span className="font-semibold text-gray-900">{s.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5">
      <div className="text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
