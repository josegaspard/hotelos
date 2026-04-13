import { Search, Hotel } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <Hotel className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">HotelOS</span>
          <span className="text-sm text-muted-foreground">Booking Engine</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Hotel className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              HotelOS Booking Engine
            </h1>
            <p className="text-muted-foreground">
              Ingresa el identificador del hotel para buscar disponibilidad
            </p>
          </div>

          <form action="" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                name="slug"
                type="text"
                placeholder="ej. hotel-playa-del-carmen"
                required
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
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
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Powered by HotelOS
      </footer>
    </div>
  );
}
