"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-gray-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">
          Page Not Found
        </h2>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          This page does not exist or may have been moved. Please check the URL or return to the dashboard.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}