"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { STATUS_LABELS, STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/types";
import type { WorkOrderStatus, WorkOrderPriority } from "@/lib/types";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface WorkOrder {
  id: string;
  referenceNumber: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledAt: string | null;
  service: { name: string } | null;
}

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/users/${id}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/work-orders?customerId=${id}&pageSize=50`).then((r) => r.json()).then((d) => d.data ?? []),
    ])
      .then(([cust, wos]) => { setCustomer(cust); setWorkOrders(wos); })
      .catch(() => setError("Failed to load customer."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !customer) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "Customer not found."}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/customers" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
      </div>

      <div className="mb-6 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Customer Information</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-900">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{customer.email}</dd>
          </div>
          {customer.phone && (
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900">{customer.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Member since</dt>
            <dd className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Work Orders ({workOrders.length})</h2>
        </div>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Reference", "Service", "Status", "Priority", "Scheduled"].map((h) => (
                <th key={h} className={headCellClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                  No work orders.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} font-mono text-xs font-semibold`}>
                    <Link href={`/admin/work-orders/${wo.id}`} className="text-blue-600 hover:underline">
                      {wo.referenceNumber}
                    </Link>
                  </td>
                  <td className={bodyCellClass}>{wo.service?.name ?? "—"}</td>
                  <td className={bodyCellClass}>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[wo.status]}`}>
                      {STATUS_LABELS[wo.status]}
                    </span>
                  </td>
                  <td className={bodyCellClass}>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[wo.priority]}`}>
                      {PRIORITY_LABELS[wo.priority]}
                    </span>
                  </td>
                  <td className={bodyCellClass}>
                    {wo.scheduledAt ? new Date(wo.scheduledAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
