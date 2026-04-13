import { redirect } from "next/navigation";
import Image from "next/image";
import {
  CalendarDays,
  Users,
  Baby,
  Search,
  MapPin,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@hotelos/shared/types";

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function HotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Organization>();

  if (!org) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Hotel no encontrado
        </h1>
        <p className="text-muted-foreground mt-2">
          No pudimos encontrar el hotel solicitado.
        </p>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const defaultCheckin = sp.checkin || formatDateInput(tomorrow);
  const defaultCheckout = sp.checkout || formatDateInput(dayAfter);
  const defaultAdults = sp.adults || "2";
  const defaultChildren = sp.children || "0";

  // Fetch cheapest room type for priceRange
  const { data: cheapestRoom } = await supabase
    .from("room_types")
    .select("base_price")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("base_price", { ascending: true })
    .limit(1)
    .single();

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: org.name,
    description: org.description || undefined,
    address: org.address
      ? {
          "@type": "PostalAddress",
          streetAddress: org.address,
          addressLocality: org.city || undefined,
          addressCountry: org.country || undefined,
        }
      : undefined,
    starRating: org.star_rating
      ? { "@type": "Rating", ratingValue: org.star_rating }
      : undefined,
    telephone: org.phone || undefined,
    image: org.cover_url || org.logo_url || undefined,
    priceRange: cheapestRoom
      ? `Desde ${org.currency} ${cheapestRoom.base_price}`
      : undefined,
  };

  const accentColor = org.primary_color || "#1e40af";

  async function searchAvailability(formData: FormData) {
    "use server";
    const checkin = formData.get("checkin") as string;
    const checkout = formData.get("checkout") as string;
    const adults = formData.get("adults") as string;
    const children = formData.get("children") as string;
    redirect(
      `/${slug}/search?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}`
    );
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      {/* Hero section */}
      <div className="relative bg-gray-900 overflow-hidden">
        {org.cover_url ? (
          <Image
            src={org.cover_url}
            alt={org.name}
            width={1200}
            height={400}
            className="w-full h-64 md:h-80 object-cover opacity-60"
            priority
          />
        ) : (
          <div
            className="w-full h-64 md:h-80"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white space-y-3 px-4">
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
              {org.name}
            </h1>
            {org.star_rating && (
              <div className="flex justify-center gap-1">
                {Array.from({ length: org.star_rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            )}
            {org.city && (
              <p className="flex items-center justify-center gap-1 text-white/90">
                <MapPin className="h-4 w-4" />
                {org.city}
                {org.country ? `, ${org.country}` : ""}
              </p>
            )}
            {org.description && (
              <p className="max-w-lg text-white/80 text-sm">
                {org.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search form */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 mb-12">
        <form
          action={searchAvailability}
          className="bg-white rounded-2xl shadow-lg border border-border p-6 md:p-8 space-y-6"
        >
          <h2 className="text-xl font-bold text-gray-900">
            Buscar disponibilidad
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Fecha de entrada
              </label>
              <input
                type="date"
                name="checkin"
                defaultValue={defaultCheckin}
                min={formatDateInput(new Date())}
                required
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Fecha de salida
              </label>
              <input
                type="date"
                name="checkout"
                defaultValue={defaultCheckout}
                min={formatDateInput(tomorrow)}
                required
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                Adultos
              </label>
              <input
                type="number"
                name="adults"
                defaultValue={defaultAdults}
                min="1"
                max="10"
                required
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Baby className="h-4 w-4 text-muted-foreground" />
                Menores
              </label>
              <input
                type="number"
                name="children"
                defaultValue={defaultChildren}
                min="0"
                max="6"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            <Search className="h-5 w-5" />
            Buscar disponibilidad
          </button>
        </form>
      </div>
    </div>
  );
}
