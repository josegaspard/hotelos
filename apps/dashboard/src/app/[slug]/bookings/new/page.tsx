"use client";

import { createClient } from "@/lib/supabase/client";
import {
  generateBookingCode,
  calculateNights,
  calculateTotalWithTax,
  calculateCommission,
} from "@hotelos/shared/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  max_occupancy: number;
  max_children: number;
  available_count: number;
}

interface OrgData {
  id: string;
  slug: string;
  currency: string;
  tax_percentage: number;
  tourism_tax: number;
  commission_rate: number;
}

export default function NewBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Step 1: Dates + occupancy
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Step 2: Room type
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");

  // Step 3: Guest info
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  useEffect(() => {
    async function loadOrg() {
      const { data } = await supabase
        .from("organizations")
        .select("id, slug, currency, tax_percentage, tourism_tax, commission_rate")
        .eq("slug", slug)
        .single();
      if (data) setOrg(data);
    }
    loadOrg();
  }, [slug, supabase]);

  useEffect(() => {
    if (!org || !checkinDate || !checkoutDate) return;

    async function loadRoomTypes() {
      // Get room types with count of available rooms
      const { data: types } = await supabase
        .from("room_types")
        .select("id, name, base_price, max_occupancy, max_children")
        .eq("organization_id", org!.id)
        .eq("is_active", true)
        .order("sort_order");

      if (!types) return;

      // For each type, count rooms not booked for these dates
      const typesWithAvailability = await Promise.all(
        types.map(async (rt) => {
          const { count: totalRooms } = await supabase
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("room_type_id", rt.id)
            .eq("is_active", true);

          const { count: bookedRooms } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("room_type_id", rt.id)
            .eq("organization_id", org!.id)
            .in("status", ["confirmed", "checked_in"])
            .lt("checkin_date", checkoutDate)
            .gt("checkout_date", checkinDate);

          return {
            ...rt,
            available_count: (totalRooms ?? 0) - (bookedRooms ?? 0),
          };
        })
      );

      setRoomTypes(typesWithAvailability);
    }

    loadRoomTypes();
  }, [org, checkinDate, checkoutDate, supabase]);

  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);
  const nights =
    checkinDate && checkoutDate
      ? calculateNights(checkinDate, checkoutDate)
      : 0;
  const subtotal = selectedRoomType ? selectedRoomType.base_price * nights : 0;
  const taxResult = org
    ? calculateTotalWithTax(subtotal, org.tax_percentage, org.tourism_tax)
    : { taxes: 0, tourismTaxAmount: 0, total: 0 };
  const commissionResult = org
    ? calculateCommission(taxResult.total, org.commission_rate)
    : { commission: 0, netHotel: 0 };

  async function handleSubmit() {
    if (!org || !selectedRoomType) return;
    setLoading(true);

    try {
      // Upsert guest by email
      const { data: existingGuest } = await supabase
        .from("guests")
        .select("id")
        .eq("organization_id", org.id)
        .eq("email", guestEmail)
        .single();

      let guestId: string;

      if (existingGuest) {
        guestId = existingGuest.id;
        await supabase
          .from("guests")
          .update({ full_name: guestName, phone: guestPhone || null })
          .eq("id", guestId);
      } else {
        const { data: newGuest } = await supabase
          .from("guests")
          .insert({
            organization_id: org.id,
            email: guestEmail,
            full_name: guestName,
            phone: guestPhone || null,
            total_stays: 0,
            total_spent: 0,
          })
          .select("id")
          .single();
        guestId = newGuest!.id;
      }

      const bookingCode = generateBookingCode(org.slug);

      const { data: booking } = await supabase
        .from("bookings")
        .insert({
          organization_id: org.id,
          booking_code: bookingCode,
          guest_id: guestId,
          room_type_id: selectedRoomTypeId,
          checkin_date: checkinDate,
          checkout_date: checkoutDate,
          nights,
          adults,
          children,
          subtotal,
          extras_total: 0,
          taxes: taxResult.taxes,
          total: taxResult.total,
          currency: org.currency,
          commission_rate: org.commission_rate,
          commission_amount: commissionResult.commission,
          net_hotel: commissionResult.netHotel,
          payment_status: "pending",
          status: "confirmed",
          source: "dashboard",
        })
        .select("id")
        .single();

      if (booking) {
        router.push(`/${slug}/bookings/${booking.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/${slug}/bookings`)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nueva reserva</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 h-0.5 ${
                  s < step ? "bg-green-300" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        {/* Step 1: Dates + occupancy */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">
              Fechas y ocupacion
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkinDate}
                  min={today}
                  onChange={(e) => setCheckinDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkoutDate}
                  min={checkinDate || today}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adultos
                </label>
                <input
                  type="number"
                  value={adults}
                  min={1}
                  max={10}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ninos
                </label>
                <input
                  type="number"
                  value={children}
                  min={0}
                  max={10}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!checkinDate || !checkoutDate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Room type */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">
              Tipo de habitacion
            </h2>
            {nights > 0 && (
              <p className="text-sm text-slate-500 mb-4">
                {checkinDate} a {checkoutDate} &middot; {nights} noche
                {nights !== 1 ? "s" : ""}
              </p>
            )}
            <div className="space-y-3 mb-6">
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setSelectedRoomTypeId(rt.id)}
                  disabled={rt.available_count <= 0}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedRoomTypeId === rt.id
                      ? "border-blue-600 bg-blue-50"
                      : rt.available_count <= 0
                        ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                        : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{rt.name}</p>
                      <p className="text-sm text-slate-500">
                        Max. {rt.max_occupancy} personas &middot;{" "}
                        {rt.available_count} disponible
                        {rt.available_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {org
                          ? new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: org.currency,
                              minimumFractionDigits: 0,
                            }).format(rt.base_price)
                          : rt.base_price}
                      </p>
                      <p className="text-xs text-slate-400">por noche</p>
                    </div>
                  </div>
                </button>
              ))}
              {roomTypes.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No hay tipos de habitacion disponibles para estas fechas
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Atras
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedRoomTypeId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Guest info */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">
              Datos del huesped
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="juan@email.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Atras
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!guestName || !guestEmail}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary + confirm */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">
              Resumen de la reserva
            </h2>
            <dl className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <dt className="text-slate-500">Huesped</dt>
                <dd className="font-medium text-slate-900">{guestName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-900">{guestEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Habitacion</dt>
                <dd className="text-slate-900">{selectedRoomType?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Fechas</dt>
                <dd className="text-slate-900">
                  {checkinDate} a {checkoutDate}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Noches</dt>
                <dd className="text-slate-900">{nights}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ocupacion</dt>
                <dd className="text-slate-900">
                  {adults} adulto{adults !== 1 ? "s" : ""}
                  {children > 0 &&
                    `, ${children} nino${children !== 1 ? "s" : ""}`}
                </dd>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-900">
                  {org &&
                    new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: org.currency,
                      minimumFractionDigits: 0,
                    }).format(subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Impuestos</dt>
                <dd className="text-slate-900">
                  {org &&
                    new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: org.currency,
                      minimumFractionDigits: 0,
                    }).format(taxResult.taxes + taxResult.tourismTaxAmount)}
                </dd>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <dt className="font-medium text-slate-900">Total</dt>
                <dd className="font-bold text-slate-900">
                  {org &&
                    new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: org.currency,
                      minimumFractionDigits: 0,
                    }).format(taxResult.total)}
                </dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Atras
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {loading ? "Creando reserva..." : "Confirmar reserva"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
