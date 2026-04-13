import { Search, Hotel, Globe, Zap, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <Hotel className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">HotelOS</span>
          <span className="text-sm text-gray-400 hidden sm:inline">Booking Engine</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
          <div className="w-full max-w-md text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Hotel className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Motor de reservas
                <span className="block text-blue-600">para tu hotel</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg max-w-sm mx-auto">
                Ingresa el identificador de tu hotel para buscar disponibilidad y reservar al instante.
              </p>
            </div>

            <form action="" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="slug"
                  type="text"
                  placeholder="ej. hotel-playa-del-carmen"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 cursor-pointer text-base shadow-sm min-h-[48px]"
              >
                Buscar hotel
              </button>
            </form>

            <script
              dangerouslySetInnerHTML={{
                __html: `
                  document.querySelector('form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    var slug = this.querySelector('input[name="slug"]').value.trim();
                    if (slug) window.location.href = '/' + encodeURIComponent(slug);
                  });
                `,
              }}
            />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Reserva instantanea</h3>
                <p className="text-xs text-gray-500">Disponibilidad en tiempo real y confirmacion inmediata.</p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Pago seguro</h3>
                <p className="text-xs text-gray-500">Procesado por Stripe con cifrado de extremo a extremo.</p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Acceso global</h3>
                <p className="text-xs text-gray-500">Reserva desde cualquier dispositivo, en cualquier momento.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        Powered by{" "}
        <a
          href="https://hotelos.io"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          HotelOS
        </a>
      </footer>
    </div>
  );
}
