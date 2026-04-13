import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  Baby,
  Bed,
  Clock,
  Mail,
  Phone,
  Globe,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@hotelos/shared/utils";
import type { Organization, Booking, Guest, RoomType } from "@hotelos/shared/types";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  DEFAULT_CANCELLATION_HOURS,
} from "@hotelos/shared/constants";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const supabase = await createClient();

  // Fetch org
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Organization>();

  if (!org) notFound();

  // Fetch booking with guest and room_type
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, guest:guests(*), room_type:room_types(*)")
    .eq("booking_code", code)
    .eq("organization_id", org.id)
    .single<Booking & { guest: Guest; room_type: RoomType }>();

  if (!booking) notFound();

  const accentColor = org.primary_color || "#1e40af";
  const currency = org.currency || "MXN";
  const checkinTime = org.checkin_time || DEFAULT_CHECKIN_TIME;
  const checkoutTime = org.checkout_time || DEFAULT_CHECKOUT_TIME;
  const cancellationHours =
    org.cancellation_policy?.hours_before || DEFAULT_CANCELLATION_HOURS;
  const cancellationType =
    org.cancellation_policy?.type || "flexible";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reserva confirmada
          </h1>
          <p className="text-gray-500 mt-1">
            Tu reserva ha sido procesada exitosamente
          </p>
        </div>
        {/* Copyable booking code */}
        <button
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-mono font-bold tracking-wider bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 transition-colors cursor-pointer copy-code-btn"
          title="Clic para copiar"
        >
          {booking.booking_code}
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <p className="text-xs text-gray-400">Clic para copiar el codigo</p>
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {/* Room info */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Alojamiento
          </h3>
          <div className="flex items-center gap-4">
            {booking.room_type?.photos &&
            booking.room_type.photos.length > 0 ? (
              <Image
                src={booking.room_type.photos[0]}
                alt={booking.room_type.name}
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
              <p className="font-bold text-gray-900">
                {booking.room_type?.name}
              </p>
              <p className="text-sm text-muted-foreground">{org.name}</p>
            </div>
          </div>
        </div>

        {/* Dates & guests */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Estancia
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Check-in
              </p>
              <p className="font-medium mt-0.5">
                {formatDate(booking.checkin_date)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Check-out
              </p>
              <p className="font-medium mt-0.5">
                {formatDate(booking.checkout_date)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                Noches
              </p>
              <p className="font-medium mt-0.5">{booking.nights}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Huespedes
              </p>
              <p className="font-medium mt-0.5">
                {booking.adults}{" "}
                {booking.adults === 1 ? "adulto" : "adultos"}
                {booking.children > 0 &&
                  `, ${booking.children} ${booking.children === 1 ? "menor" : "menores"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Guest info */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Huesped
          </h3>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-gray-900">
              {booking.guest?.full_name}
            </p>
            {booking.guest?.email && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {booking.guest.email}
              </p>
            )}
            {booking.guest?.phone && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {booking.guest.phone}
              </p>
            )}
            {booking.guest?.nationality && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {booking.guest.nationality}
              </p>
            )}
          </div>
        </div>

        {/* Price summary */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pago
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alojamiento</span>
              <span>{formatCurrency(booking.subtotal, currency)}</span>
            </div>
            {booking.extras_total > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicios</span>
                <span>
                  {formatCurrency(booking.extras_total, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatCurrency(booking.taxes, currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total pagado</span>
              <span style={{ color: accentColor }}>
                {formatCurrency(booking.total, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Politicas del hotel
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Check-in: a partir de las {checkinTime} hrs
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Check-out: antes de las {checkoutTime} hrs
            </p>
            <p>
              Cancelacion {cancellationType}: hasta {cancellationHours}{" "}
              horas antes del check-in
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 min-h-[48px]"
            style={{ backgroundColor: accentColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al hotel
          </Link>
          <Link
            href={`/${slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 min-h-[48px]"
          >
            Hacer otra reserva
          </Link>
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 cursor-pointer print-button min-h-[48px]"
        >
          <Printer className="h-4 w-4" />
          Imprimir confirmacion
        </button>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', function(e) {
              if (e.target.closest('.print-button')) {
                window.print();
              }
              if (e.target.closest('.copy-code-btn')) {
                navigator.clipboard.writeText('${booking.booking_code}').then(function() {
                  var btn = document.querySelector('.copy-code-btn');
                  var original = btn.innerHTML;
                  btn.textContent = 'Copiado!';
                  setTimeout(function() { btn.innerHTML = original; }, 2000);
                });
              }
            });
          `,
        }}
      />
    </div>
  );
}
