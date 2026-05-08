"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/types";
import type { WorkOrderStatus } from "@/lib/types";

interface TrackingResult {
  referenceNumber: string;
  status: WorkOrderStatus;
  scheduledAt: string | null;
  customerFirstName: string | null;
  serviceName: string | null;
  technicianFirstName: string | null;
}

export default function TrackPage() {
  const { ref } = useParams<{ ref: string }>();
  const [data, setData] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/public/work-orders/${ref}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ref]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">V</span>
            <span className="text-lg font-bold text-gray-900">VoiceOps</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Track your work order</h1>
        </div>

        {loading && (
          <div className="flex justify-center">
            <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        )}

        {notFound && !loading && (
          <div className="rounded-lg border border-red-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-gray-900">Not found</p>
            <p className="mt-1 text-sm text-gray-500">
              We couldn't find a work order with reference <span className="font-mono font-semibold">{ref}</span>.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Go home
            </Link>
          </div>
        )}

        {data && !loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Reference</p>
                <p className="font-mono text-lg font-bold text-gray-900">{data.referenceNumber}</p>
              </div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[data.status]}`}>
                {STATUS_LABELS[data.status]}
              </span>
            </div>

            <dl className="grid gap-3 text-sm">
              {data.customerFirstName && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <dt className="text-gray-500">Customer</dt>
                  <dd className="font-medium text-gray-900">{data.customerFirstName}</dd>
                </div>
              )}
              {data.serviceName && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <dt className="text-gray-500">Service</dt>
                  <dd className="font-medium text-gray-900">{data.serviceName}</dd>
                </div>
              )}
              {data.scheduledAt && (
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <dt className="text-gray-500">Scheduled</dt>
                  <dd className="font-medium text-gray-900">{new Date(data.scheduledAt).toLocaleString()}</dd>
                </div>
              )}
              {data.technicianFirstName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Technician</dt>
                  <dd className="font-medium text-gray-900">{data.technicianFirstName}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
