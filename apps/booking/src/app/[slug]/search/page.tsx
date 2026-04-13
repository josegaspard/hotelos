import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  Baby,
  Bed,
  Maximize,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Bath,
  ShowerHead,
  ParkingCircle,
  ConciergeBell,
  SearchX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  calculateNights,
} from "@hotelos/shared/utils";
import { AMENITY_LABELS } from "@hotelos/shared/constants";
import type { Organization, RoomType } from "@hotelos/shared/types";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  tv: <Tv className="h-3.5 w-3.5" />,
  coffee_maker: <Coffee className="h-3.5 w-3.5" />,
  bathtub: <Bath className="h-3.5 w-3.5" />,
  shower: <ShowerHead className="h-3.5 w-3.5" />,
  parking: <ParkingCircle className="h-3.5 w-3.5" />,
  room_service: <ConciergeBell className="h-3.5 w-3.5" />,
};

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const checkin = sp.checkin;
  const checkout = sp.checkout;
  const adults = parseInt(sp.adults || "2", 10);
  const children = parseInt(sp.children || "0", 10);

  if (!checkin || !checkout) {
    notFound();
  }

  const nights = calculateNights(checkin, checkout);
  const supabase = await createClient();

  // Fetch org
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Organization>();

  if (!org) notFound();

  const accentColor = org.primary_color || "#1e40af";

  // Fetch active room types
  const { data: roomTypes } = await supabase
    .from("room_types")
    .select("*")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("sort_order");

  if (!roomTypes || roomTypes.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <SearchX className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold text-gray-900">
          No hay habitaciones configuradas
        </h1>
        <p className="text-muted-foreground">
          Este hotel aun no tiene tipos de habitacion disponibles.
        </p>
      </div>
    );
  }

  // For each room type, count total active rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, room_type_id")
    .eq("organization_id", org.id)
    .eq("is_active", true);

  // Fetch overlapping bookings (not cancelled/no_show)
  const { data: overlappingBookings } = await supabase
    .from("bookings")
    .select("id, room_type_id")
    .eq("organization_id", org.id)
    .not("status", "in", '("cancelled","no_show")')
    .lt("checkin_date", checkout)
    .gt("checkout_date", checkin);

  // Fetch availability (closed dates / price overrides)
  const roomTypeIds = roomTypes.map((rt: RoomType) => rt.id);
  const { data: availabilityData } = await supabase
    .from("availability")
    .select("*")
    .in("room_type_id", roomTypeIds)
    .gte("date", checkin)
    .lt("date", checkout);

  // Fetch rate periods
  const { data: ratePeriods } = await supabase
    .from("rate_periods")
    .select("*")
    .eq("organization_id", org.id)
    .lte("start_date", checkout)
    .gte("end_date", checkin);

  // Build room count per type
  const roomCountByType: Record<string, number> = {};
  (rooms || []).forEach((r: { room_type_id: string }) => {
    roomCountByType[r.room_type_id] =
      (roomCountByType[r.room_type_id] || 0) + 1;
  });

  // Build booked count per type
  const bookedCountByType: Record<string, number> = {};
  (overlappingBookings || []).forEach(
    (b: { room_type_id: string }) => {
      bookedCountByType[b.room_type_id] =
        (bookedCountByType[b.room_type_id] || 0) + 1;
    }
  );

  // Check closed dates per room type
  const closedByType: Record<string, boolean> = {};
  (availabilityData || []).forEach(
    (a: { room_type_id: string; is_closed: boolean }) => {
      if (a.is_closed) closedByType[a.room_type_id] = true;
    }
  );

  // Build price overrides map: room_type_id -> date -> price_override
  const priceOverrides: Record<string, Record<string, number>> = {};
  (availabilityData || []).forEach(
    (a: {
      room_type_id: string;
      date: string;
      price_override: number | null;
    }) => {
      if (a.price_override !== null) {
        if (!priceOverrides[a.room_type_id])
          priceOverrides[a.room_type_id] = {};
        priceOverrides[a.room_type_id][a.date] = a.price_override;
      }
    }
  );

  // Calculate average rate modifier from overlapping rate periods
  let avgRateModifier = 0;
  if (ratePeriods && ratePeriods.length > 0) {
    avgRateModifier =
      ratePeriods.reduce(
        (sum: number, rp: { rate_modifier: number }) =>
          sum + rp.rate_modifier,
        0
      ) / ratePeriods.length;
  }

  // Build results
  type SearchResult = {
    roomType: RoomType;
    available: number;
    pricePerNight: number;
    totalPrice: number;
  };

  const results: SearchResult[] = [];

  for (const rt of roomTypes as RoomType[]) {
    // Skip if closed
    if (closedByType[rt.id]) continue;

    // Check capacity
    if (adults + children > rt.max_occupancy) continue;

    const totalRooms = roomCountByType[rt.id] || 0;
    const booked = bookedCountByType[rt.id] || 0;
    const available = totalRooms - booked;

    if (available <= 0) continue;

    // Calculate nightly price
    // Generate dates for the stay
    const stayDates: string[] = [];
    const d = new Date(checkin + "T12:00:00");
    const endD = new Date(checkout + "T12:00:00");
    while (d < endD) {
      stayDates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    let totalPrice = 0;
    for (const date of stayDates) {
      const override = priceOverrides[rt.id]?.[date];
      if (override !== undefined) {
        totalPrice += override;
      } else {
        let price = rt.base_price;
        if (avgRateModifier !== 0) {
          price = price * (1 + avgRateModifier / 100);
        }
        // Extra person charge
        if (adults > rt.base_occupancy) {
          price += (adults - rt.base_occupancy) * rt.extra_person_charge;
        }
        totalPrice += price;
      }
    }

    const pricePerNight = totalPrice / nights;

    results.push({
      roomType: rt,
      available,
      pricePerNight: Math.round(pricePerNight * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Search summary */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {formatDateDisplay(checkin)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">
            {formatDateDisplay(checkout)}
          </span>
          <span className="text-muted-foreground">
            ({nights} {nights === 1 ? "noche" : "noches"})
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            {adults} {adults === 1 ? "adulto" : "adultos"}
          </span>
          {children > 0 && (
            <span className="flex items-center gap-1">
              <Baby className="h-4 w-4 text-muted-foreground" />
              {children} {children === 1 ? "menor" : "menores"}
            </span>
          )}
        </div>
        <Link
          href={`/${slug}`}
          className="ml-auto text-sm font-medium hover:underline"
          style={{ color: accentColor }}
        >
          Modificar busqueda
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {results.length > 0
          ? `${results.length} ${results.length === 1 ? "habitacion disponible" : "habitaciones disponibles"}`
          : "No hay habitaciones disponibles"}
      </h1>

      {results.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <SearchX className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            No hay habitaciones disponibles para las fechas seleccionadas.
          </p>
          <Link
            href={`/${slug}`}
            className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accentColor }}
          >
            Buscar otras fechas
          </Link>
        </div>
      )}

      {/* Room cards */}
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.roomType.id}
            className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row">
              {/* Photo */}
              <div className="md:w-72 md:min-h-56 bg-gray-100 flex-shrink-0">
                {result.roomType.photos && result.roomType.photos.length > 0 ? (
                  <Image
                    src={result.roomType.photos[0]}
                    alt={result.roomType.name}
                    width={288}
                    height={224}
                    className="w-full h-48 md:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-48 md:h-full flex items-center justify-center">
                    <Bed className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {result.roomType.name}
                    </h3>
                    {result.roomType.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {result.roomType.description}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Max {result.roomType.max_occupancy}{" "}
                      {result.roomType.max_occupancy === 1
                        ? "persona"
                        : "personas"}
                    </span>
                    {result.roomType.size_sqm && (
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5" />
                        {result.roomType.size_sqm} m²
                      </span>
                    )}
                    {result.roomType.bed_type && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        Cama {result.roomType.bed_type}
                      </span>
                    )}
                  </div>

                  {/* Amenities */}
                  {result.roomType.amenities &&
                    result.roomType.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.roomType.amenities
                          .slice(0, 6)
                          .map((amenity: string) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface rounded-full text-xs text-muted-foreground"
                            >
                              {AMENITY_ICONS[amenity] || null}
                              {AMENITY_LABELS[amenity] || amenity}
                            </span>
                          ))}
                        {result.roomType.amenities.length > 6 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{result.roomType.amenities.length - 6} mas
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {/* Price & CTA */}
                <div className="flex items-end justify-between mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(result.pricePerNight, org.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      por noche &middot;{" "}
                      {formatCurrency(result.totalPrice, org.currency)} total
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.available}{" "}
                      {result.available === 1
                        ? "disponible"
                        : "disponibles"}
                    </p>
                  </div>
                  <Link
                    href={`/${slug}/book?room_type_id=${result.roomType.id}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}`}
                    className="px-6 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
