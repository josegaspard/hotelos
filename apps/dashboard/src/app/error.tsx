"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 px-4">
        <div className="text-5xl font-bold text-red-200">Error</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Algo salio mal
        </h1>
        {error.message && (
          <p className="text-gray-500 max-w-md text-sm">{error.message}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-8">HotelOS</p>
      </div>
    </div>
  );
}
