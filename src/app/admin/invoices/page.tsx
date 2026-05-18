"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FileText, LoaderCircle, Plus } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Invoice {
  id: string;
  referenceNumber: string;
  status: string;
  total: number;
  issueDate: string | null;
  dueDate: string | null;
  customer: { name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((p: number, s: string) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(p), pageSize: "20" });
    if (s) params.set("status", s);
    fetch(`/api/invoices?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setInvoices(d.data ?? []); setTotal(d.total ?? 0); })
      .catch(() => setError("Failed to load invoices."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, statusFilter); }, [page, statusFilter, load]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">Manage customer invoices</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> New invoice
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none"
        >
          <option value="">All statuses</option>
          {["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section className="mb-4 overflow-hidden rounded-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Reference", "Customer", "Total", "Status", "Issue Date", "Due Date"].map((h) => (
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
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <FileText className="h-10 w-10 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">No invoices yet</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {statusFilter
                          ? `No invoices match the "${statusFilter}" filter.`
                          : "Create your first invoice to get started."}
                      </p>
                    </div>
                    {!statusFilter && (
                      <Link
                        href="/admin/invoices/new"
                        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus size={14} /> New invoice
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} font-mono text-xs font-semibold`}>
                    <Link href={`/admin/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.referenceNumber}
                    </Link>
                  </td>
                  <td className={bodyCellClass}>{inv.customer?.name ?? "—"}</td>
                  <td className={bodyCellClass}>${(inv.total ?? 0).toFixed(2)}</td>
                  <td className={bodyCellClass}>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className={bodyCellClass}>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "—"}</td>
                  <td className={bodyCellClass}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
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
