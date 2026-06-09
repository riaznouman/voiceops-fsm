"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface CustomerPickerProps {
  value: string;
  onChange: (id: string, customer?: Customer) => void;
  error?: string;
}

export default function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced server-side search. Runs on mount (empty query → first 20),
  // then on every keystroke once a selection is cleared.
  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/users?role=CUSTOMER&search=${encodeURIComponent(q)}&pageSize=20`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => setResults(d.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, selected]);

  // Keep the selection in sync if the parent clears the value externally.
  useEffect(() => {
    if (!value && selected) setSelected(null);
  }, [value, selected]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function select(c: Customer) {
    setSelected(c);
    setOpen(false);
    setQuery("");
    onChange(c.id, c);
  }

  function clear() {
    setSelected(null);
    onChange("");
    setOpen(true);
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{selected.name}</p>
          <p className="truncate text-xs text-gray-500">{selected.email}</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Change customer"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          placeholder="Search customers by name or email…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputCls + " pl-9"}
        />
        {loading && (
          <LoaderCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-500">
              {loading ? "Searching…" : "No customers found."}
            </li>
          ) : (
            results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c)}
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="block text-sm font-medium text-gray-900">{c.name}</span>
                  <span className="block text-xs text-gray-500">{c.email}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
