"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { statusOptions } from "@/lib/mock/work-orders";

export default function JobTableFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const status = params.get("status") ?? "ALL";

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "ALL") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.push(qs ? `/admin/work-orders?${qs}` : "/admin/work-orders");
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: search });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(e) => update({ status: e.target.value })}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or work order ref..."
          className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-gray-100 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          Search
        </button>
      </form>
    </div>
  );
}
