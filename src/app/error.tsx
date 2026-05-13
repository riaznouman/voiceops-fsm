"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm text-gray-500">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-[11px] text-gray-400">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
