import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <span className="text-4xl font-bold text-gray-300">4</span>
        <span className="text-4xl font-bold text-blue-600">0</span>
        <span className="text-4xl font-bold text-gray-300">4</span>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
