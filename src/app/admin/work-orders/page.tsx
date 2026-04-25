import { Plus } from "lucide-react";
import JobPriorityBadge from "@/components/admin/work-orders/JobPriorityBadge";
import JobStatusBadge from "@/components/admin/work-orders/JobStatusBadge";
import JobTableFilters from "@/components/admin/work-orders/JobTableFilters";
import {
  mockWorkOrders,
  type WorkOrderStatus,
} from "@/lib/mock/work-orders";
import { bodyCellClass, headCellClass, jobColumns } from "./columns";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

const validStatuses: WorkOrderStatus[] = [
  "PENDING",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default async function WorkOrdersPage({ searchParams }: PageProps) {
  const { status = "ALL", q = "" } = await searchParams;
  const statusFilter = (validStatuses as string[]).includes(status)
    ? (status as WorkOrderStatus)
    : null;
  const search = q.trim().toLowerCase();

  const rows = mockWorkOrders.filter((wo) => {
    const statusMatch = statusFilter === null || wo.status === statusFilter;
    const searchMatch =
      !search ||
      wo.customer.toLowerCase().includes(search) ||
      wo.ref.toLowerCase().includes(search);
    return statusMatch && searchMatch;
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500">View and manage all work orders</p>
        </div>
        {/* TODO: link to /admin/work-orders/create — Sprint 2 */}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          New Work Order
        </button>
      </div>

      <JobTableFilters />

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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={jobColumns.length}
                  className="px-3 py-12 text-center text-sm text-gray-500"
                >
                  No work orders match your filters.
                </td>
              </tr>
            ) : (
              rows.map((wo) => (
                <tr key={wo.ref} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} font-mono text-xs font-semibold text-gray-900`}>
                    {wo.ref}
                  </td>
                  <td className={bodyCellClass}>{wo.customer}</td>
                  <td className={bodyCellClass}>{wo.service}</td>
                  <td className={`${bodyCellClass} text-gray-500`}>{wo.scheduledAt}</td>
                  <td className={bodyCellClass}>
                    <JobStatusBadge status={wo.status} />
                  </td>
                  <td className={bodyCellClass}>
                    <JobPriorityBadge priority={wo.priority} />
                  </td>
                  <td className={bodyCellClass}>
                    {wo.technician ?? (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className={`${bodyCellClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Page 1 of 3</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-400"
          >
            Previous
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
