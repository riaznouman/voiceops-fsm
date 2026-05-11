"use client";

import { useState } from "react";

interface Technician {
  id: string;
  name: string;
}

interface Props {
  workOrderId: string;
  currentTechnicianId: string | null;
  technicians: Technician[];
  onAssigned: (technicianId: string | null, technicianName: string | null) => void;
}

export default function TechnicianAssignSelect({
  workOrderId,
  currentTechnicianId,
  technicians,
  onAssigned,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value || null;
    if (newId === currentTechnicianId) return;
    if (!newId) {
      setError("Use the work order detail page to clear an assignment.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: newId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not reassign.");
        return;
      }
      const tech = technicians.find((t) => t.id === newId);
      onAssigned(newId, tech?.name ?? null);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <select
        value={currentTechnicianId ?? ""}
        disabled={saving}
        onChange={handleChange}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{currentTechnicianId ? "—" : "Unassigned"}</option>
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-0.5 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
