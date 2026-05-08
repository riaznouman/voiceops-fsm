"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LoaderCircle, Phone } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Call {
  id: string;
  fromNumber: string;
  startedAt: string;
  durationSec: number | null;
  status: string;
  summary?: string | null;
  workOrder?: { id: string; referenceNumber: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
};

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

function formatDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((p: number) => {
    setLoading(true);
    setError("");
    fetch(`/api/voice/calls?page=${p}&pageSize=20`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setCalls(d.data ?? []); setTotal(d.total ?? 0); })
      .catch(() => setError("Failed to load call logs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Voice Call Logs</h1>
        <p className="text-sm text-gray-500">All inbound AI voice agent calls</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section className="mb-4 overflow-hidden rounded-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["From", "Started at", "Duration", "Summary", "Status", "Work Order"].map((h) => (
                <th key={h} className={headCellClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-500">No call logs yet.</td>
              </tr>
            ) : (
              calls.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} flex items-center gap-1.5`}>
                    <Phone size={13} className="text-gray-400" />
                    {c.fromNumber}
                  </td>
                  <td className={bodyCellClass}>{new Date(c.startedAt).toLocaleString()}</td>
                  <td className={bodyCellClass}>{formatDuration(c.durationSec)}</td>
                  <td className={`${bodyCellClass} max-w-[200px]`}>
                    <Link href={`/admin/calls/${c.id}`} className="block truncate text-blue-600 hover:underline">
                      {c.summary ?? "View transcript"}
                    </Link>
                  </td>
                  <td className={bodyCellClass}>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className={bodyCellClass}>
                    {c.workOrder ? (
                      <Link href={`/admin/work-orders/${c.workOrder.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                        {c.workOrder.referenceNumber}
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
    </>
  );
}
