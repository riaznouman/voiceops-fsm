"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";

interface User { id: string; name: string; email: string; }
interface Service { id: string; name: string; }

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    priority: "NORMAL",
    scheduledAt: "",
    address: "",
    issueDescription: "",
  });

  useEffect(() => {
    fetch("/api/users?role=CUSTOMER&pageSize=200")
      .then((r) => r.json())
      .then((d) => setCustomers(d.data ?? []))
      .catch(() => {});
    fetch("/api/services?pageSize=200")
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? d ?? []))
      .catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = "Customer is required.";
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setProcessing(true);
    try {
      const r = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          serviceId: form.serviceId || undefined,
          priority: form.priority,
          scheduledAt: form.scheduledAt || undefined,
          address: form.address || undefined,
          issueDescription: form.issueDescription || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrors({ form: data.error ?? "Failed to create work order." });
        return;
      }
      router.push(`/admin/work-orders/${data.id}`);
    } catch {
      setErrors({ form: "Something went wrong." });
    } finally {
      setProcessing(false);
    }
  }

  const inputCls =
    "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/work-orders" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Work Order</h1>
      </div>

      <div className="max-w-xl rounded-md border border-gray-200 bg-white p-6">
        {errors.form && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>Customer *</label>
            <select
              value={form.customerId}
              onChange={(e) => set("customerId", e.target.value)}
              className={inputCls + " w-full"}
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-xs text-red-600">{errors.customerId}</p>}
          </div>

          <div>
            <label className={labelCls}>Service</label>
            <select
              value={form.serviceId}
              onChange={(e) => set("serviceId", e.target.value)}
              className={inputCls + " w-full"}
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className={inputCls + " w-full"}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Scheduled at</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <input
              type="text"
              placeholder="Service address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div>
            <label className={labelCls}>Issue description</label>
            <textarea
              rows={4}
              placeholder="Describe the issue…"
              value={form.issueDescription}
              onChange={(e) => set("issueDescription", e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Link
              href="/admin/work-orders"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Create work order
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
