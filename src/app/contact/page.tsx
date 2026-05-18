"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle, LoaderCircle } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [processing, setProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setProcessing(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">V</span>
            <span className="text-lg font-bold text-gray-900">VoiceOps</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Contact us</h1>
          <p className="mt-1 text-sm text-gray-500">
            We'll get back to you as soon as possible.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Message sent!</h2>
            <p className="mt-1 text-sm text-gray-500">
              Thanks for reaching out. We'll be in touch shortly.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Full name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Bishal Pandey"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  placeholder="+61 4xx xxx xxx"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Message *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Send message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
