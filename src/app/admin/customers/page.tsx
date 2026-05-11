"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    (p: number, s: string) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ role: "CUSTOMER", page: String(p), pageSize: "20" });
      if (s) params.set("q", s);
      fetch(`/api/users?${params}`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((d) => { setCustomers(d.data ?? []); setTotal(d.total ?? 0); })
        .catch(() => setError("Failed to load customers."))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => { load(page, search); }, [page, search, load]);

  function handleSearch() {
    setPage(1);
    setSearch(q);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">All registered customers</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            aria-label="Search customers by name or email"
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section
        aria-busy={loading}
        className="mb-4 overflow-hidden rounded-md border border-gray-300 bg-white"
      >
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Phone", "Registered"].map((h) => (
                <th key={h} className={headCellClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center" role="status" aria-label="Loading customers">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-sm text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                >
                  <td className={`${bodyCellClass} font-medium text-gray-900`}>
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                      {c.name}
                    </Link>
                  </td>
                  <td className={bodyCellClass}>{c.email}</td>
                  <td className={bodyCellClass}>{c.phone ?? "—"}</td>
                  <td className={bodyCellClass}>
                    {new Date(c.createdAt).toLocaleDateString()}
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
