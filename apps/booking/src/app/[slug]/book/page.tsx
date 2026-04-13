"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Bed,
  CalendarDays,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  Baby,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrency,
  calculateNights,
  calculateTotalWithTax,
  calculateCommission,
  generateBookingCode,
} from "@hotelos/shared/utils";
import type { Organization, RoomType, Service } from "@hotelos/shared/types";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "./checkout-form";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type BookingStep = 1 | 2 | 3 | 4 | 5;

interface SelectedService {
  service: Service;
  quantity: number;
}

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug;

  const roomTypeId = searchParams.get("room_type_id") || "";
  const checkin = searchParams.get("checkin") || "";
  const checkout = searchParams.get("checkout") || "";
  const adults = parseInt(searchParams.get("adults") || "2", 10);
  const childrenCount = parseInt(searchParams.get("children") || "0", 10);

  const nights = calculateNights(checkin, checkout);

  const [step, setStep] = useState<BookingStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [createdBookingCode, setCreatedBookingCode] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);

  const [org, setOrg] = useState<Organization | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<
    SelectedService[]
  >([]);

  // Nightly prices
  const [nightlyPrices, setNightlyPrices] = useState<
    { date: string; price: number }[]
  >([]);

  // Guest form
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNationality, setGuestNationality] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch org
      const { data: orgData, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      if (orgErr || !orgData) throw new Error("Hotel no encontrado");
      setOrg(orgData as Organization);

      // Fetch room type
      const { data: rtData, error: rtErr } = await supabase
        .from("room_types")
        .select("*")
        .eq("id", roomTypeId)
        .eq("organization_id", orgData.id)
        .single();
      if (rtErr || !rtData) throw new Error("Tipo de habitacion no encontrado");
      setRoomType(rtData as RoomType);

      // Fetch services
      const { data: svcData } = await supabase
        .from("services")
        .select("*")
        .eq("organization_id", orgData.id)
        .eq("is_active", true)
        .order("name");
      setServices((svcData as Service[]) || []);

      // Calculate nightly prices
      const stayDates: string[] = [];
      const d = new Date(checkin + "T12:00:00");
      const endD = new Date(checkout + "T12:00:00");
      while (d < endD) {
        stayDates.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }

      // Fetch availability overrides
      const { data: availData } = await supabase
        .from("availability")
        .select("date, price_override")
        .eq("room_type_id", roomTypeId)
        .in("date", stayDates);

      // Fetch rate periods
      const { data: ratePeriods } = await supabase
        .from("rate_periods")
        .select("*")
        .eq("organization_id", orgData.id)
        .lte("start_date", checkout)
        .gte("end_date", checkin);

      const overrideMap: Record<string, number> = {};
      (availData || []).forEach(
        (a: { date: string; price_override: number | null }) => {
          if (a.price_override !== null) overrideMap[a.date] = a.price_override;
        }
      );

      let avgMod = 0;
      if (ratePeriods && ratePeriods.length > 0) {
        avgMod =
          ratePeriods.reduce(
            (s: number, rp: { rate_modifier: number }) => s + rp.rate_modifier,
            0
          ) / ratePeriods.length;
      }

      const rt = rtData as RoomType;
      const prices = stayDates.map((date) => {
        if (overrideMap[date] !== undefined) {
          return { date, price: overrideMap[date] };
        }
        let price = rt.base_price;
        if (avgMod !== 0) price = price * (1 + avgMod / 100);
        if (adults > rt.base_occupancy) {
          price += (adults - rt.base_occupancy) * rt.extra_person_charge;
        }
        return { date, price: Math.round(price * 100) / 100 };
      });
      setNightlyPrices(prices);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos"
      );
    } finally {
      setLoading(false);
    }
  }, [slug, roomTypeId, checkin, checkout, adults, supabase]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = nightlyPrices.reduce((s, p) => s + p.price, 0);

  const extrasTotal = selectedServices.reduce((s, ss) => {
    let price = ss.service.price * ss.quantity;
    if (
      ss.service.price_type === "per_night" ||
      ss.service.price_type === "per_person_per_night"
    ) {
      price *= nights;
    }
    if (
      ss.service.price_type === "per_person" ||
      ss.service.price_type === "per_person_per_night"
    ) {
      price *= adults + childrenCount;
    }
    return s + price;
  }, 0);

  const taxInfo = org
    ? calculateTotalWithTax(
        subtotal + extrasTotal,
        org.tax_percentage,
        org.tourism_tax
      )
    : { taxes: 0, tourismTaxAmount: 0, total: 0 };

  const commissionInfo = org
    ? calculateCommission(taxInfo.total, org.commission_rate)
    : { commission: 0, netHotel: 0 };

  const currency = org?.currency || "MXN";
  const accentColor = org?.primary_color || "#1e40af";

  function toggleService(svc: Service) {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.service.id === svc.id);
      if (exists) return prev.filter((s) => s.service.id !== svc.id);
      return [...prev, { service: svc, quantity: 1 }];
    });
  }

  function formatDateShort(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Check if Stripe is available for this org
  useEffect(() => {
    if (org?.stripe_account_id && org?.stripe_onboarding_complete) {
      setStripeAvailable(true);
    }
  }, [org]);

  async function handleSubmit() {
    if (!org || !roomType) return;

    try {
      setSubmitting(true);
      setError(null);

      // Upsert guest
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
          .update({
            full_name: guestName,
            phone: guestPhone || null,
            nationality: guestNationality || null,
          })
          .eq("id", guestId);
      } else {
        const { data: newGuest, error: guestErr } = await supabase
          .from("guests")
          .insert({
            organization_id: org.id,
            email: guestEmail,
            full_name: guestName,
            phone: guestPhone || null,
            nationality: guestNationality || null,
          })
          .select("id")
          .single();
        if (guestErr || !newGuest) throw new Error("Error al crear huesped");
        guestId = newGuest.id;
      }

      const bookingCode = generateBookingCode(slug);

      // If Stripe is available, create as pending_payment; otherwise confirm directly
      const useStripePayment = stripeAvailable;

      const { data: bookingData, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          organization_id: org.id,
          booking_code: bookingCode,
          guest_id: guestId,
          room_type_id: roomType.id,
          checkin_date: checkin,
          checkout_date: checkout,
          nights,
          adults,
          children: childrenCount,
          subtotal: Math.round(subtotal * 100) / 100,
          extras_total: Math.round(extrasTotal * 100) / 100,
          taxes: Math.round(taxInfo.taxes * 100) / 100,
          total: Math.round(taxInfo.total * 100) / 100,
          currency,
          commission_rate: org.commission_rate,
          commission_amount: commissionInfo.commission,
          net_hotel: commissionInfo.netHotel,
          payment_status: useStripePayment ? "pending" : "paid",
          status: useStripePayment ? "pending_payment" : "confirmed",
          source: "widget",
          special_requests: specialRequests || null,
        })
        .select("id, booking_code")
        .single();

      if (bookingErr || !bookingData)
        throw new Error("Error al crear reserva");

      // Insert booking services
      if (selectedServices.length > 0) {
        await supabase.from("booking_services").insert(
          selectedServices.map((ss) => ({
            booking_code: bookingCode,
            organization_id: org.id,
            service_id: ss.service.id,
            service_name: ss.service.name,
            quantity: ss.quantity,
            unit_price: ss.service.price,
            total: (() => {
              let p = ss.service.price * ss.quantity;
              if (
                ss.service.price_type === "per_night" ||
                ss.service.price_type === "per_person_per_night"
              )
                p *= nights;
              if (
                ss.service.price_type === "per_person" ||
                ss.service.price_type === "per_person_per_night"
              )
                p *= adults + childrenCount;
              return p;
            })(),
          }))
        );
      }

      if (useStripePayment) {
        // Create payment intent and show checkout form
        const piRes = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingData.id,
            organization_id: org.id,
          }),
        });

        const piData = await piRes.json();

        if (!piRes.ok) {
          throw new Error(
            piData.error || "Error al inicializar el pago"
          );
        }

        setCreatedBookingId(bookingData.id);
        setCreatedBookingCode(bookingData.booking_code);
        setClientSecret(piData.clientSecret);
        setStep(5);
        setSubmitting(false);
      } else {
        // No Stripe - redirect directly to confirmation
        router.push(`/${slug}/confirmation/${bookingCode}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar la reserva"
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <p className="text-lg font-medium text-gray-900">{error}</p>
      </div>
    );
  }

  if (!roomType || !org) return null;

  const stepLabels = stripeAvailable
    ? ["Habitacion", "Servicios", "Datos", "Confirmar", "Pago"]
    : ["Habitacion", "Servicios", "Datos", "Confirmar"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as BookingStep;
          const active = step === stepNum;
          const done = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: active || done ? accentColor : "#e2e8f0",
                    color: active || done ? "#fff" : "#64748b",
                  }}
                >
                  {done ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`text-sm hidden sm:inline ${
                    active ? "font-semibold text-gray-900" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{
                    backgroundColor: done ? accentColor : "#e2e8f0",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Review room */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {roomType.photos && roomType.photos.length > 0 && (
            <Image
              src={roomType.photos[0]}
              alt={roomType.name}
              width={800}
              height={400}
              className="w-full h-56 md:h-72 object-cover"
            />
          )}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {roomType.name}
              </h2>
              {roomType.description && (
                <p className="text-muted-foreground mt-1">
                  {roomType.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDateShort(checkin)} → {formatDateShort(checkout)}
              </span>
              <span className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                {nights} {nights === 1 ? "noche" : "noches"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {adults} {adults === 1 ? "adulto" : "adultos"}
              </span>
              {childrenCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Baby className="h-4 w-4" />
                  {childrenCount} {childrenCount === 1 ? "menor" : "menores"}
                </span>
              )}
            </div>

            {/* Nightly breakdown */}
            <div className="bg-surface rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Desglose por noche
              </h3>
              {nightlyPrices.map((np) => (
                <div
                  key={np.date}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatDateShort(np.date)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(np.price, currency)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                <span>Subtotal alojamiento</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">
            Servicios adicionales
          </h2>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay servicios adicionales disponibles.
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => {
                const selected = selectedServices.some(
                  (s) => s.service.id === svc.id
                );
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selected
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {svc.name}
                          </p>
                          {svc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(svc.price, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {svc.price_type === "per_night"
                            ? "por noche"
                            : svc.price_type === "per_person"
                              ? "por persona"
                              : svc.price_type === "per_person_per_night"
                                ? "por persona/noche"
                                : "por estancia"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedServices.length > 0 && (
            <div className="bg-surface rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Servicios seleccionados
              </h3>
              {selectedServices.map((ss) => {
                let price = ss.service.price * ss.quantity;
                if (
                  ss.service.price_type === "per_night" ||
                  ss.service.price_type === "per_person_per_night"
                )
                  price *= nights;
                if (
                  ss.service.price_type === "per_person" ||
                  ss.service.price_type === "per_person_per_night"
                )
                  price *= adults + childrenCount;
                return (
                  <div
                    key={ss.service.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {ss.service.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(price, currency)}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                <span>Total servicios</span>
                <span>{formatCurrency(extrasTotal, currency)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Guest details */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">
            Datos del huesped
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Nombre completo *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                placeholder="Juan Perez"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                placeholder="juan@email.com"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={guestNationality}
                  onChange={(e) => setGuestNationality(e.target.value)}
                  placeholder="Mexicana"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Solicitudes especiales
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Ej. Llegada tardia, cama extra, piso alto..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Summary & confirm */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">
            Resumen de reserva
          </h2>

          <div className="space-y-4">
            {/* Room */}
            <div className="flex items-center gap-4">
              {roomType.photos && roomType.photos.length > 0 ? (
                <Image
                  src={roomType.photos[0]}
                  alt={roomType.name}
                  width={80}
                  height={60}
                  className="w-20 h-15 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-15 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Bed className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">{roomType.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateShort(checkin)} → {formatDateShort(checkout)}{" "}
                  &middot; {nights} {nights === 1 ? "noche" : "noches"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {adults} {adults === 1 ? "adulto" : "adultos"}
                  {childrenCount > 0 &&
                    `, ${childrenCount} ${childrenCount === 1 ? "menor" : "menores"}`}
                </p>
              </div>
            </div>

            {/* Guest */}
            <div className="bg-surface rounded-xl p-4 space-y-1">
              <h3 className="text-sm font-semibold text-gray-700">Huesped</h3>
              <p className="text-sm">{guestName}</p>
              <p className="text-sm text-muted-foreground">{guestEmail}</p>
              {guestPhone && (
                <p className="text-sm text-muted-foreground">{guestPhone}</p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="bg-surface rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Desglose de precios
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Alojamiento ({nights} {nights === 1 ? "noche" : "noches"})
                </span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Servicios adicionales
                  </span>
                  <span>{formatCurrency(extrasTotal, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Impuestos ({org!.tax_percentage}%)
                </span>
                <span>{formatCurrency(taxInfo.taxes, currency)}</span>
              </div>
              {taxInfo.tourismTaxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Impuesto turistico
                  </span>
                  <span>
                    {formatCurrency(taxInfo.tourismTaxAmount, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                <span>Total</span>
                <span style={{ color: accentColor }}>
                  {formatCurrency(taxInfo.total, currency)}
                </span>
              </div>
            </div>

            {specialRequests && (
              <div className="bg-surface rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Solicitudes especiales
                </h3>
                <p className="text-sm text-muted-foreground">
                  {specialRequests}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Stripe Payment */}
      {step === 5 && clientSecret && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <CreditCard
                  className="w-5 h-5"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pago seguro
                </h2>
                <p className="text-sm text-muted-foreground">
                  Completa tu pago para confirmar la reserva
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total a pagar
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: accentColor }}
              >
                {formatCurrency(taxInfo.total, currency)}
              </span>
            </div>
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: accentColor,
                  borderRadius: "12px",
                },
              },
            }}
          >
            <CheckoutForm
              bookingId={createdBookingId!}
              clientSecret={clientSecret}
              total={taxInfo.total}
              currency={currency}
              accentColor={accentColor}
              returnUrl={`${window.location.origin}/${slug}/confirmation/${createdBookingCode}`}
            />
          </Elements>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between" style={{ display: step === 5 ? "none" : undefined }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as BookingStep)}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 4 && step < 5 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 3 && (!guestName.trim() || !guestEmail.trim())) {
                setError("Por favor completa nombre y email.");
                return;
              }
              setError(null);
              setStep((s) => (s + 1) as BookingStep);
            }}
            className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm"
            style={{ backgroundColor: accentColor }}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : stripeAvailable ? (
              <>
                <CreditCard className="h-4 w-4" />
                Proceder al pago
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirmar reserva
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
