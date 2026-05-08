"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle, Mic, User } from "lucide-react";

interface TranscriptTurn {
  id: string;
  role: "AI" | "CALLER" | string;
  message: string;
  timestamp?: string | null;
}

interface Call {
  id: string;
  fromNumber: string;
  startedAt: string;
  endedAt?: string | null;
  durationSec: number | null;
  status: string;
  summary?: string | null;
  transcript?: TranscriptTurn[];
  workOrder?: { id: string; referenceNumber: string } | null;
}

function formatDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/voice/calls/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCall)
      .catch(() => setError("Call not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !call) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "Call not found."}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/calls" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Call — {call.fromNumber}</h1>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">From</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{call.fromNumber}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Started</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{new Date(call.startedAt).toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Duration</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{formatDuration(call.durationSec)}</p>
        </div>
      </div>

      {call.workOrder && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Booking created:&nbsp;
          <Link href={`/admin/work-orders/${call.workOrder.id}`} className="font-mono font-semibold text-green-700 hover:underline">
            {call.workOrder.referenceNumber}
          </Link>
        </div>
      )}

      {call.summary && (
        <div className="mb-5 rounded-md border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Summary</h3>
          <p className="text-sm text-gray-700">{call.summary}</p>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Transcript</h3>
        {(call.transcript ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No transcript available.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(call.transcript ?? []).map((turn) => {
              const isAI = turn.role === "AI" || turn.role === "assistant";
              return (
                <div
                  key={turn.id}
                  className={`flex gap-2.5 ${isAI ? "" : "flex-row-reverse"}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${isAI ? "bg-blue-600" : "bg-gray-500"}`}>
                    {isAI ? <Mic size={13} /> : <User size={13} />}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg px-3.5 py-2.5 text-sm ${
                      isAI
                        ? "rounded-tl-none bg-blue-50 text-gray-800"
                        : "rounded-tr-none bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {isAI ? "AI Agent" : "Caller"}
                    </p>
                    {turn.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
