"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import JobPriorityBadge from "@/components/admin/work-orders/JobPriorityBadge";
import JobStatusBadge from "@/components/admin/work-orders/JobStatusBadge";
import JobTableFilters from "@/components/admin/work-orders/JobTableFilters";
// TODO: uncomment before submit
// import Pagination from "@/components/ui/Pagination";
import type { WorkOrderStatus, WorkOrderPriority } from "@/lib/types";
import { bodyCellClass, headCellClass, jobColumns } from "./columns";

interface WorkOrder {
  id: string;
  referenceNumber: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledAt: string | null;
  customer: { id: string; name: string } | null;
  technician: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
}

function WorkOrdersContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "ALL";
  const qParam = searchParams.get("q") ?? "";

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    (p: number, status: string, q: string) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(p), pageSize: "20" });
      if (status && status !== "ALL") params.set("status", status);
      if (q) params.set("q", q);
      fetch(`/api/work-orders?${params}`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((d) => {
          setWorkOrders(d.data ?? []);
          setTotal(d.total ?? 0);
        })
        .catch(() => setError("Failed to load work orders."))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    setPage(1);
    load(1, statusParam, qParam);
  }, [statusParam, qParam, load]);

  useEffect(() => {
    load(page, statusParam, qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500">View and manage all work orders</p>
        </div>
        <Link
          href="/admin/work-orders/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          New Work Order
        </Link>
      </div>

      <JobTableFilters />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="mb-4 overflow-hidden rounded-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {jobColumns.map((col) => (
                <th
                  key={col.key}
                  className={
                    col.key === "actions"
                      ? `${headCellClass} text-right`
                      : headCellClass
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={jobColumns.length} className="py-12 text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={jobColumns.length}
                  className="px-3 py-12 text-center text-sm text-gray-500"
                >
                  No work orders match your filters.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} font-mono text-xs font-semibold text-gray-900`}>
                    {wo.referenceNumber}
                  </td>
                  <td className={bodyCellClass}>{wo.customer?.name ?? "—"}</td>
                  <td className={bodyCellClass}>{wo.service?.name ?? "—"}</td>
                  <td className={`${bodyCellClass} text-gray-500`}>
                    {wo.scheduledAt ? new Date(wo.scheduledAt).toLocaleString() : "—"}
                  </td>
                  <td className={bodyCellClass}>
                    <JobStatusBadge status={wo.status} />
                  </td>
                  <td className={bodyCellClass}>
                    <JobPriorityBadge priority={wo.priority} />
                  </td>
                  <td className={bodyCellClass}>
                    {wo.technician?.name ?? (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className={`${bodyCellClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/work-orders/${wo.id}`}
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/work-orders/${wo.id}`}
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* TODO: uncomment before submit */}
      {/* <Pagination page={page} pageSize={20} total={total} onPage={setPage} /> */}
    </>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={null}>
      <WorkOrdersContent />
    </Suspense>
  );
}
