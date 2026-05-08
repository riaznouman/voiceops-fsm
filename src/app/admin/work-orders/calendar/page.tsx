"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { STATUS_STYLES, STATUS_LABELS } from "@/lib/types";
import type { WorkOrderStatus } from "@/lib/types";

interface WorkOrder {
  id: string;
  referenceNumber: string;
  status: WorkOrderStatus;
  scheduledAt: string | null;
  customer: { name: string } | null;
  service: { name: string } | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function WorkOrderCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    fetch(`/api/work-orders?from=${from}&to=${to}&pageSize=200`)
      .then((r) => r.json())
      .then((d) => setWorkOrders(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function woForDay(day: number): WorkOrder[] {
    return workOrders.filter((wo) => {
      if (!wo.scheduledAt) return false;
      const d = new Date(wo.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const cells: (number | null)[] = Array.from(
    { length: firstDay },
    () => null as number | null
  ).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDay =
    today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">Work orders by scheduled date</p>
        </div>
        <Link
          href="/admin/work-orders/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New Work Order
        </Link>
      </div>

      <div className="rounded-md border border-gray-300 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <button type="button" onClick={prevMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <button type="button" onClick={nextMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayWos = day ? woForDay(day) : [];
              const isToday = day !== null && day === todayDay;
              return (
                <div
                  key={i}
                  className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 last:border-r-0 ${
                    !day ? "bg-gray-50" : ""
                  }`}
                >
                  {day !== null && (
                    <>
                      <div
                        className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dayWos.slice(0, 3).map((wo) => (
                          <Link
                            key={wo.id}
                            href={`/admin/work-orders/${wo.id}`}
                            className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${STATUS_STYLES[wo.status]} hover:opacity-80`}
                          >
                            {wo.customer?.name ?? wo.referenceNumber}
                          </Link>
                        ))}
                        {dayWos.length > 3 && (
                          <span className="px-1 text-[10px] text-gray-400">+{dayWos.length - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {(Object.entries(STATUS_LABELS) as [WorkOrderStatus, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className={`inline-block h-3 w-3 rounded-full ${STATUS_STYLES[s]}`} />
            {label}
          </div>
        ))}
      </div>
    </>
  );
}
