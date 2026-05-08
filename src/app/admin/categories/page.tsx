"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Category { id: string; name: string; description?: string | null; }

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";
const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/categories?pageSize=200")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? d ?? []))
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setForm({ name: "", description: "" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditTarget(c);
    setForm({ name: c.name, description: c.description ?? "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const body = { name: form.name, description: form.description || undefined };
      const r = editTarget
        ? await fetch(`/api/categories/${editTarget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error ?? "Save failed.");
        return;
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage service categories</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add category
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section className="overflow-hidden rounded-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Description", ""].map((h) => (
                <th key={h} className={h === "" ? `${headCellClass} text-right` : headCellClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-12 text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-sm text-gray-500">No categories yet.</td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className={`${bodyCellClass} font-medium text-gray-900`}>{c.name}</td>
                  <td className={bodyCellClass}>{c.description ?? "—"}</td>
                  <td className={`${bodyCellClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(c)} className="rounded border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => handleDelete(c.id)} className="rounded border border-gray-300 p-1.5 text-red-400 hover:bg-red-50">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Modal title={editTarget ? "Edit category" : "Add category"} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Save
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
