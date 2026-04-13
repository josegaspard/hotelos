import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 px-4">
        <div className="text-6xl font-bold text-gray-200">404</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pagina no encontrada
        </h1>
        <p className="text-gray-500 max-w-md">
          La pagina que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Ir al inicio
        </Link>
        <p className="text-xs text-gray-400 mt-8">HotelOS</p>
      </div>
    </div>
  );
}
