"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    if (code.length !== 6) e.code = "Enter the 6-digit code from your email.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (password !== passwordConfirmation) e.passwordConfirmation = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setProcessing(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error ?? "Reset failed." });
        return;
      }

      router.push("/login?reset=1");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the 6-digit code we sent and choose a new password.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-gray-700">
              Reset code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="rounded-md border border-gray-300 px-3 py-2 text-center text-lg font-semibold tracking-[0.4em] text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              id="passwordConfirmation"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            {errors.passwordConfirmation && (
              <p className="text-xs text-red-600">{errors.passwordConfirmation}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Reset password
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Didn&apos;t receive a code? Request another
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
