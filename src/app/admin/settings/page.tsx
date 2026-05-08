"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

type Tab = "Profile" | "Password" | "Preferences";
const TABS: Tab[] = ["Profile", "Password", "Preferences"];

interface ProfileForm { name: string; email: string; phone: string; }
interface PasswordForm { currentPassword: string; newPassword: string; confirmPassword: string; }
interface Preferences { emailNotifications: boolean; smsNotifications: boolean; }

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem("voiceops_prefs");
    if (raw) return JSON.parse(raw) as Preferences;
  } catch {}
  return { emailNotifications: true, smsNotifications: false };
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Profile");
  const [profileForm, setProfileForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pwForm, setPwForm] = useState<PasswordForm>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [prefs, setPrefs] = useState<Preferences>({ emailNotifications: true, smsNotifications: false });
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setProfileForm({ name: d.name ?? "", email: d.email ?? "", phone: d.phone ?? "" }))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
    setPrefs(loadPrefs());
  }, []);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
      });
      if (r.ok) setProfileMsg({ type: "ok", text: "Profile updated." });
      else setProfileMsg({ type: "err", text: "Update failed." });
    } catch {
      setProfileMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "err", text: "Passwords do not match." });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const r = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (r.ok) {
        setPwMsg({ type: "ok", text: "Password changed." });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const d = await r.json();
        setPwMsg({ type: "err", text: d.error ?? "Failed to change password." });
      }
    } catch {
      setPwMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setPwSaving(false);
    }
  }

  function savePrefs(updated: Preferences) {
    setPrefs(updated);
    localStorage.setItem("voiceops_prefs", JSON.stringify(updated));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="max-w-md rounded-md border border-gray-200 bg-white p-6">
          {profileLoading ? (
            <div className="flex h-24 items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              {profileMsg && (
                <div className={`rounded-md border px-4 py-3 text-sm ${profileMsg.type === "ok" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                  {profileMsg.text}
                </div>
              )}
              <div>
                <label className={labelCls}>Full name</label>
                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email address</label>
                <input type="email" value={profileForm.email} disabled className={inputCls + " opacity-60"} />
                <p className="mt-1 text-[11px] text-gray-400">Email cannot be changed.</p>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+61 4xx xxx xxx" className={inputCls} />
              </div>
              <div className="flex justify-end border-t border-gray-200 pt-4">
                <button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {profileSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}Save changes
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "Password" && (
        <div className="max-w-md rounded-md border border-gray-200 bg-white p-6">
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            {pwMsg && (
              <div className={`rounded-md border px-4 py-3 text-sm ${pwMsg.type === "ok" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                {pwMsg.text}
              </div>
            )}
            <div>
              <label className={labelCls}>Current password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className={inputCls} autoComplete="current-password" />
            </div>
            <div>
              <label className={labelCls}>New password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className={inputCls} autoComplete="new-password" />
            </div>
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} className={inputCls} autoComplete="new-password" />
            </div>
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <button type="submit" disabled={pwSaving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {pwSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}Change password
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "Preferences" && (
        <div className="max-w-md rounded-md border border-gray-200 bg-white p-6">
          {prefsSaved && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              Preferences saved.
            </div>
          )}
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Email notifications</p>
                <p className="text-xs text-gray-500">Receive emails for new work orders and status changes</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={(e) => savePrefs({ ...prefs, emailNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">SMS notifications</p>
                <p className="text-xs text-gray-500">Receive SMS alerts for urgent jobs (coming soon)</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.smsNotifications}
                onChange={(e) => savePrefs({ ...prefs, smsNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
