"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LoaderCircle,
  ChevronLeft,
  Upload,
  ImageIcon,
  ClipboardList,
  Activity,
  Info,
} from "lucide-react";
import { STATUS_LABELS, STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/types";
import type { WorkOrderStatus, WorkOrderPriority } from "@/lib/types";

interface WorkOrderDetail {
  id: string;
  referenceNumber: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledAt: string | null;
  address: string | null;
  issueDescription: string | null;
  customer: { id: string; name: string; email: string; phone?: string } | null;
  technician: { id: string; name: string; role?: string } | null;
  service: { id: string; name: string; category?: string; durationMinutes?: number } | null;
}

interface Note {
  id: string;
  body: string;
  author?: { name: string };
  createdAt: string;
}

interface Photo {
  id: string;
  url: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface Technician {
  id: string;
  name: string;
}

const TABS = ["Overview", "Notes", "Photos", "Activity"] as const;
type Tab = (typeof TABS)[number];

const STATUSES: WorkOrderStatus[] = [
  "PENDING",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assigningTech, setAssigningTech] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function loadWo() {
    const r = await fetch(`/api/work-orders/${id}`);
    if (!r.ok) throw new Error("Not found");
    return r.json() as Promise<WorkOrderDetail>;
  }

  useEffect(() => {
    setLoading(true);
    loadWo()
      .then((data) => {
        setWo(data);
        setAssigningTech(data.technician?.id ?? "");
      })
      .catch(() => setError("Work order not found."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === "Notes") {
      fetch(`/api/work-orders/${id}/notes`).then((r) => r.json()).then(setNotes).catch(() => {});
    } else if (tab === "Photos") {
      fetch(`/api/work-orders/${id}/photos`).then((r) => r.json()).then(setPhotos).catch(() => {});
    } else if (tab === "Activity") {
      fetch(`/api/work-orders/${id}/activity`).then((r) => r.json()).then(setActivity).catch(() => {});
    }
  }, [tab, id]);

  useEffect(() => {
    fetch("/api/users?role=TECHNICIAN&pageSize=100")
      .then((r) => r.json())
      .then((d) => setTechnicians(d.data ?? []))
      .catch(() => {});
  }, []);

  async function handleStatusChange(newStatus: WorkOrderStatus) {
    if (!wo) return;
    setUpdatingStatus(true);
    try {
      const r = await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) setWo({ ...wo, status: newStatus });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAssign() {
    if (!assigningTech) return;
    setAssigning(true);
    try {
      const r = await fetch(`/api/work-orders/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: assigningTech }),
      });
      if (r.ok) {
        const updated = await loadWo();
        setWo(updated);
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const r = await fetch(`/api/work-orders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newNote }),
      });
      if (r.ok) {
        const note = await r.json();
        setNotes((prev) => [note, ...prev]);
        setNewNote("");
      }
    } finally {
      setSavingNote(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch(`/api/work-orders/${id}/photos`, {
        method: "POST",
        body: form,
      });
      if (r.ok) {
        const photo = await r.json();
        setPhotos((prev) => [photo, ...prev]);
      }
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !wo) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "Work order not found."}
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/work-orders")}
          className="text-gray-400 hover:text-gray-700"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 font-mono">{wo.referenceNumber}</h1>
        </div>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[wo.status]}`}>
          {STATUS_LABELS[wo.status]}
        </span>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[wo.priority]}`}>
          {PRIORITY_LABELS[wo.priority]}
        </span>
      </div>

      {/* Status + Assign bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={wo.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value as WorkOrderStatus)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {updatingStatus && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-blue-600" />}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Technician</label>
          <select
            value={assigningTech}
            onChange={(e) => setAssigningTech(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={assigning}
            className="inline-flex items-center gap-1 rounded border border-blue-600 bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {assigning && <LoaderCircle className="h-3 w-3 animate-spin" />}
            Assign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t === "Overview" && <Info size={14} />}
            {t === "Notes" && <ClipboardList size={14} />}
            {t === "Photos" && <ImageIcon size={14} />}
            {t === "Activity" && <Activity size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Customer</h3>
            {wo.customer ? (
              <dl className="grid gap-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-500">Name</dt>
                  <dd className="text-gray-900">
                    <Link href={`/admin/customers/${wo.customer.id}`} className="text-blue-600 hover:underline">
                      {wo.customer.name}
                    </Link>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-500">Email</dt>
                  <dd className="text-gray-900">{wo.customer.email}</dd>
                </div>
                {wo.customer.phone && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{wo.customer.phone}</dd>
                  </div>
                )}
                {wo.address && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-gray-500">Address</dt>
                    <dd className="text-gray-900">{wo.address}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No customer assigned</p>
            )}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Service</h3>
            {wo.service ? (
              <dl className="grid gap-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-500">Name</dt>
                  <dd className="text-gray-900">{wo.service.name}</dd>
                </div>
                {wo.service.category && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-500">Category</dt>
                    <dd className="text-gray-900">{wo.service.category}</dd>
                  </div>
                )}
                {wo.scheduledAt && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-500">Scheduled</dt>
                    <dd className="text-gray-900">
                      {new Date(wo.scheduledAt).toLocaleString()}
                    </dd>
                  </div>
                )}
                {wo.service.durationMinutes && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-500">Duration</dt>
                    <dd className="text-gray-900">{wo.service.durationMinutes} min</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No service assigned</p>
            )}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4 sm:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Technician</h3>
            {wo.technician ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                  {wo.technician.name.charAt(0)}
                </div>
                <div>
                  <Link href={`/admin/technicians/${wo.technician.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {wo.technician.name}
                  </Link>
                  {wo.technician.role && (
                    <span className="ml-2 inline-block rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {wo.technician.role}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No technician assigned yet</p>
            )}
          </div>

          {wo.issueDescription && (
            <div className="rounded-md border border-gray-200 bg-white p-4 sm:col-span-2">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Issue Description</h3>
              <p className="text-sm text-gray-700">{wo.issueDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {tab === "Notes" && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleAddNote} className="rounded-md border border-gray-200 bg-white p-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Add note
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Write a note…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingNote || !newNote.trim()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingNote && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Add note
            </button>
          </form>

          {notes.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No notes yet.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-md border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-800">{n.body}</p>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  {n.author?.name ?? "Admin"} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Photos */}
      {tab === "Photos" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {uploadingPhoto ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              Upload photo
            </label>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <ImageIcon size={28} />
              <p className="text-sm">No photos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={p.url}
                    alt="Work order photo"
                    className="h-32 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === "Activity" && (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          {activity.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No activity recorded.</p>
          ) : (
            <ol className="relative border-l border-gray-200 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="mb-6 last:mb-0">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                  <p className="text-sm text-gray-800">{a.message}</p>
                  <time className="mt-0.5 block text-[11px] text-gray-400">
                    {new Date(a.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
