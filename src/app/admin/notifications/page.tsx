"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, LoaderCircle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/notifications?pageSize=50")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setNotifications(d.data ?? d ?? []))
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
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
          {notifications.map((n) => (
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
              <div className="flex-1">
                <p className={`text-sm ${n.read ? "text-gray-700" : "font-medium text-gray-900"}`}>
                  {n.message}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
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
          ))}
        </ul>
      )}
    </>
  );
}
