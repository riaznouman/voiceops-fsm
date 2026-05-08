"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LoaderCircle, Plus, X } from "lucide-react";
import { STATUS_LABELS, STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/types";
import type { WorkOrderStatus, WorkOrderPriority } from "@/lib/types";

interface Skill { id: string; name: string; }
interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  skills?: Skill[];
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

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tech, setTech] = useState<Technician | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [skillSaving, setSkillSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/users/${id}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/work-orders?technicianId=${id}&pageSize=50`).then((r) => r.json()).then((d) => d.data ?? []),
      fetch("/api/skills?pageSize=200").then((r) => r.json()).then((d) => d.data ?? d ?? []),
    ])
      .then(([t, wos, skills]) => { setTech(t); setWorkOrders(wos); setAllSkills(skills); })
      .catch(() => setError("Failed to load technician."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddSkill(e: FormEvent) {
    e.preventDefault();
    if (!selectedSkill) return;
    setSkillSaving(true);
    try {
      const r = await fetch(`/api/users/${id}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: selectedSkill }),
      });
      if (r.ok) {
        const updated = await fetch(`/api/users/${id}`).then((r2) => r2.json());
        setTech(updated);
        setSelectedSkill("");
        setAddingSkill(false);
      }
    } finally {
      setSkillSaving(false);
    }
  }

  async function handleRemoveSkill(skillId: string) {
    try {
      await fetch(`/api/users/${id}/skills/${skillId}`, { method: "DELETE" });
      setTech((prev) =>
        prev ? { ...prev, skills: (prev.skills ?? []).filter((s) => s.id !== skillId) } : prev
      );
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !tech) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error || "Technician not found."}
      </div>
    );
  }

  const currentSkillIds = new Set((tech.skills ?? []).map((s) => s.id));
  const addableSkills = allSkills.filter((s) => !currentSkillIds.has(s.id));

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/technicians" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{tech.name}</h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Technician Information</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{tech.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{tech.email}</dd>
            </div>
            {tech.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{tech.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Joined</dt>
              <dd className="text-gray-900">{new Date(tech.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Skills</h2>
            <button
              type="button"
              onClick={() => setAddingSkill((v) => !v)}
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {addingSkill && (
            <form onSubmit={handleAddSkill} className="mb-3 flex items-center gap-2">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none"
              >
                <option value="">Select skill…</option>
                {addableSkills.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={skillSaving || !selectedSkill}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {skillSaving && <LoaderCircle className="h-3 w-3 animate-spin" />}
                Add
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-1.5">
            {(tech.skills ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No skills assigned.</p>
            ) : (
              (tech.skills ?? []).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-700"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Assigned Work Orders ({workOrders.length})</h2>
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
                <td colSpan={5} className="py-10 text-center text-sm text-gray-500">No work orders assigned.</td>
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
