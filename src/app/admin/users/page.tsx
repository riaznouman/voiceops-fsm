"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { LoaderCircle, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

const ROLES = ["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"] as const;
const STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"] as const;
type Role = (typeof ROLES)[number];
type Status = (typeof STATUSES)[number];

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  status: Status;
  emailVerifiedAt: string | null;
  createdAt: string;
}

const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCellClass =
  "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [info, setInfo] = useState("");

  const load = useCallback((p: number, role: string, s: string) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(p), pageSize: "20" });
    if (role) params.set("role", role);
    if (s) params.set("search", s);
    fetch(`/api/users?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setUsers(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, roleFilter, search);
  }, [page, roleFilter, search, load]);

  function handleSearch() {
    setPage(1);
    setSearch(q);
  }

  async function patchUser(id: string, body: Partial<{ role: Role; status: Status }>) {
    setSavingId(id);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
      setInfo(`Updated ${data.name}.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Users &amp; Roles</h1>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? "Change a user's role or status."
              : "Read-only view (only ADMIN can change roles)."}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>

        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value as "" | Role);
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {info}
        </div>
      )}

      <section className="mb-4 overflow-hidden rounded-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Status", "Verified", "Joined"].map((h) => (
                <th key={h} className={headCellClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = session?.user?.id === u.id;
                const disabled = !isAdmin || savingId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className={`${bodyCellClass} font-medium text-gray-900`}>
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                          You
                        </span>
                      )}
                    </td>
                    <td className={bodyCellClass}>{u.email}</td>
                    <td className={bodyCellClass}>
                      <select
                        value={u.role}
                        disabled={disabled || isSelf}
                        onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={bodyCellClass}>
                      <select
                        value={u.status}
                        disabled={disabled || isSelf}
                        onChange={(e) =>
                          patchUser(u.id, { status: e.target.value as Status })
                        }
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={bodyCellClass}>
                      {u.emailVerifiedAt ? (
                        <span className="text-green-700">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className={bodyCellClass}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
    </>
  );
}
