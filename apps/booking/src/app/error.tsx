"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Booking error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Algo salio mal
          </h1>
          {error.message && (
            <p className="text-gray-500 text-sm">{error.message}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 cursor-pointer text-sm min-h-[48px]"
          >
            <RotateCcw className="h-4 w-4" />
            Intentar de nuevo
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 cursor-pointer text-sm min-h-[48px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
        <p className="text-xs text-gray-400 pt-4">
          Powered by{" "}
          <span className="font-semibold text-gray-500">HotelOS</span>
        </p>
      </div>
    </div>
  );
}
