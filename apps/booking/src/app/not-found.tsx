import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 px-4">
        <div className="text-6xl font-bold text-gray-200">404</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hotel no encontrado
        </h1>
        <p className="text-gray-500 max-w-md">
          Verifica la URL e intenta de nuevo.
        </p>
        <p className="text-xs text-gray-400 mt-8">
          Powered by <span className="font-semibold text-gray-500">HotelOS</span>
        </p>
      </div>
    </div>
  );
}
