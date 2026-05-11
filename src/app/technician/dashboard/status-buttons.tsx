"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

const NEXT_STATUS: Record<string, { label: string; to: string }[]> = {
  PENDING: [{ label: "Start trip", to: "EN_ROUTE" }],
  EN_ROUTE: [{ label: "Arrived", to: "ON_SITE" }],
  ON_SITE: [{ label: "Begin work", to: "IN_PROGRESS" }],
  IN_PROGRESS: [{ label: "Mark done", to: "COMPLETED" }],
};

export default function StatusButtons({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const options = NEXT_STATUS[status] ?? [];

  async function update(to: string) {
    setError("");
    const res = await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Update failed.");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (options.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.to}
            type="button"
            disabled={isPending}
            onClick={() => update(opt.to)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending && <LoaderCircle className="h-3 w-3 animate-spin" />}
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
