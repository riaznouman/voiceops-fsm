"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle, Plus, Trash2 } from "lucide-react";

interface User { id: string; name: string; email: string; }
interface WorkOrder { id: string; referenceNumber: string; }

interface LineItem { description: string; quantity: string; unitPrice: string; }

const inputCls =
  "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<User[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerId: "",
    workOrderId: "",
    dueDate: "",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  useEffect(() => {
    fetch("/api/users?role=CUSTOMER&pageSize=200")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setCustomers(d.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.customerId) { setWorkOrders([]); return; }
    fetch(`/api/work-orders?customerId=${form.customerId}&pageSize=50`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setWorkOrders(d.data ?? []))
      .catch(() => {});
  }, [form.customerId]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setItem(i: number, field: keyof LineItem, value: string) {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeItem(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = lineItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.customerId) errs.customerId = "Customer is required.";
    if (lineItems.some((li) => !li.description.trim())) errs.lineItems = "All line items need a description.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setProcessing(true);
    setErrors({});
    try {
      const r = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          workOrderId: form.workOrderId || undefined,
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
          lineItems: lineItems.map((li) => ({
            description: li.description,
            quantity: parseFloat(li.quantity) || 1,
            unitPrice: parseFloat(li.unitPrice) || 0,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrors({ form: data.error ?? "Failed to create invoice." });
        return;
      }
      router.push(`/admin/invoices/${data.id}`);
    } catch {
      setErrors({ form: "Something went wrong." });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/invoices" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <div className="max-w-2xl rounded-md border border-gray-200 bg-white p-6">
        {errors.form && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer *</label>
            <select
              value={form.customerId}
              onChange={(e) => setField("customerId", e.target.value)}
              className={inputCls + " w-full"}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-xs text-red-600">{errors.customerId}</p>}
          </div>

          {workOrders.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Work order (optional)</label>
              <select
                value={form.workOrderId}
                onChange={(e) => setField("workOrderId", e.target.value)}
                className={inputCls + " w-full"}
              >
                <option value="">None</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>{wo.referenceNumber}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Line items</label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Plus size={12} /> Add item
              </button>
            </div>
            {errors.lineItems && <p className="mb-2 text-xs text-red-600">{errors.lineItems}</p>}
            <div className="flex flex-col gap-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] items-center gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => setItem(i, "description", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => setItem(i, "quantity", e.target.value)}
                    className={inputCls + " text-center"}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => setItem(i, "unitPrice", e.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={lineItems.length === 1}
                    className="flex h-9 w-8 items-center justify-center rounded text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 ml-auto max-w-xs border-t border-gray-200 pt-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (10%)</span><span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              placeholder="Optional notes…"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Link href="/admin/invoices" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Create invoice
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
