"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  referenceNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  issueDate: string | null;
  dueDate: string | null;
  notes?: string | null;
  customer: { id: string; name: string; email: string; phone?: string } | null;
  workOrder?: { id: string; referenceNumber: string } | null;
  lineItems?: LineItem[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["PAID", "OVERDUE", "CANCELLED"],
  PAID: [],
  OVERDUE: ["PAID", "CANCELLED"],
  CANCELLED: [],
};

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadInvoice() {
    const r = await fetch(`/api/invoices/${id}`);
    if (!r.ok) throw new Error("Not found");
    return r.json() as Promise<Invoice>;
  }

  useEffect(() => {
    setLoading(true);
    loadInvoice()
      .then(setInvoice)
      .catch(() => setError("Invoice not found."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!invoice) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) setInvoice({ ...invoice, status: newStatus });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !invoice) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "Invoice not found."}
      </div>
    );
  }

  const nextStatuses = STATUS_TRANSITIONS[invoice.status] ?? [];

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <Link href="/admin/invoices" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="flex-1 font-mono text-xl font-bold text-gray-900">{invoice.referenceNumber}</h1>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[invoice.status] ?? ""}`}>
          {invoice.status}
        </span>
      </div>

      {nextStatuses.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3">
          <span className="text-xs font-medium text-gray-500">Update status:</span>
          {nextStatuses.map((s) => (
            <button
              key={s}
              type="button"
              disabled={updating}
              onClick={() => handleStatusUpdate(s)}
              className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {updating && <LoaderCircle className="h-3 w-3 animate-spin" />}
              Mark {s}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Customer</h3>
          {invoice.customer ? (
            <dl className="grid gap-1 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-gray-500">Name</dt>
                <dd>
                  <Link href={`/admin/customers/${invoice.customer.id}`} className="text-blue-600 hover:underline">
                    {invoice.customer.name}
                  </Link>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-gray-500">Email</dt>
                <dd className="text-gray-900">{invoice.customer.email}</dd>
              </div>
            </dl>
          ) : <p className="text-sm text-gray-400">No customer</p>}
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Invoice Details</h3>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-gray-500">Issue date</dt>
              <dd className="text-gray-900">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-gray-500">Due date</dt>
              <dd className="text-gray-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</dd>
            </div>
            {invoice.workOrder && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-500">Work order</dt>
                <dd>
                  <Link href={`/admin/work-orders/${invoice.workOrder.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                    {invoice.workOrder.referenceNumber}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-md border border-gray-300 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700">Line Items</h3>
        </div>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Description", "Qty", "Unit Price", "Total"].map((h) => (
                <th key={h} className={h === "Total" ? `${headCellClass} text-right` : headCellClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">No line items.</td>
              </tr>
            ) : (
              (invoice.lineItems ?? []).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className={bodyCellClass}>{item.description}</td>
                  <td className={bodyCellClass}>{item.quantity}</td>
                  <td className={bodyCellClass}>${(item.unitPrice ?? 0).toFixed(2)}</td>
                  <td className={`${bodyCellClass} text-right font-medium`}>${(item.lineTotal ?? 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="ml-auto max-w-xs space-y-1 text-sm">
            {invoice.subtotal != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">
                  GST ({Math.round((invoice.taxRate ?? 0.1) * 100)}%)
                </span>
                <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
              <span>Total</span>
              <span>${(invoice.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Notes</h3>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}
    </>
  );
}
