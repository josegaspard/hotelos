import Link from "next/link";
import { Hotel, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Hotel className="h-8 w-8 text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-6xl font-bold text-gray-200">404</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Hotel no encontrado
          </h1>
          <p className="text-gray-500 text-sm">
            Verifica la URL e intenta de nuevo.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 text-sm min-h-[48px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <p className="text-xs text-gray-400 pt-4">
          Powered by{" "}
          <span className="font-semibold text-gray-500">HotelOS</span>
        </p>
      </div>
    </div>
  );
}
