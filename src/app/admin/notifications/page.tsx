"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, LoaderCircle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function formatRelative(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    fetch("/api/notifications?pageSize=50")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load notifications.");
        }
        return r.json();
      })
      .then((d) => setNotifications(d.data ?? d ?? []))
      .catch((e: Error) => setError(e.message || "Failed to load notifications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to mark notification as read.");
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to mark all as read.");
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {markingAll ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCheck size={15} />}
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <Bell size={32} />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const content = (
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`text-sm ${n.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <p className={`mt-0.5 text-sm ${n.read ? "text-gray-500" : "text-gray-700"}`}>
                    {n.body}
                  </p>
                )}
              </div>
            );
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 rounded-md border px-4 py-3.5 transition-colors ${
                  n.read
                    ? "border-gray-200 bg-white"
                    : "border-blue-100 bg-blue-50"
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"}`}>
                  <Bell size={14} />
                </div>
                {n.link ? (
                  <Link href={n.link} className="min-w-0 flex-1 hover:underline">
                    {content}
                  </Link>
                ) : (
                  content
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded border border-gray-300 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Mark as read"
                  >
                    <Check size={13} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
