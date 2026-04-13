import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@hotelos/shared/utils";
import { BOOKING_STATUS_LABELS } from "@hotelos/shared/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BookingActions } from "./booking-actions";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-slate-100 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ slug: string; bookingId: string }>;
}) {
  const { slug, bookingId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, guests(*), room_types(name), rooms(room_number)")
    .eq("id", bookingId)
    .eq("organization_id", org.id)
    .single();

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Reserva no encontrada</p>
        <Link
          href={`/${slug}/bookings`}
          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
        >
          Volver a reservas
        </Link>
      </div>
    );
  }

  const guest = booking.guests as Record<string, unknown>;
  const roomType = booking.room_types as Record<string, unknown>;
  const room = booking.rooms as Record<string, unknown> | null;

  const sourceLabels: Record<string, string> = {
    widget: "Widget web",
    dashboard: "Dashboard",
    phone: "Telefono",
    walk_in: "Walk-in",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/bookings`}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Reserva {booking.booking_code as string}
          </h1>
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${
              statusColors[booking.status as string] ?? "bg-slate-100"
            }`}
          >
            {BOOKING_STATUS_LABELS[booking.status as string] ??
              (booking.status as string)}
          </span>
        </div>
        <BookingActions
          bookingId={bookingId}
          status={booking.status as string}
          roomTypeId={booking.room_type_id as string}
          roomId={booking.room_id as string | null}
          organizationId={org.id}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reserva section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Reserva</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Codigo</dt>
              <dd className="font-mono font-medium text-slate-900">
                {booking.booking_code as string}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Estado</dt>
              <dd>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[booking.status as string] ?? "bg-slate-100"
                  }`}
                >
                  {BOOKING_STATUS_LABELS[booking.status as string] ??
                    (booking.status as string)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Origen</dt>
              <dd className="text-slate-900">
                {sourceLabels[booking.source as string] ??
                  (booking.source as string)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Check-in</dt>
              <dd className="text-slate-900">
                {booking.checkin_date as string}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Check-out</dt>
              <dd className="text-slate-900">
                {booking.checkout_date as string}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Noches</dt>
              <dd className="text-slate-900">{booking.nights as number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Adultos</dt>
              <dd className="text-slate-900">{booking.adults as number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ninos</dt>
              <dd className="text-slate-900">{booking.children as number}</dd>
            </div>
          </dl>
        </div>

        {/* Huesped section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Huesped</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium text-slate-900">
                {guest?.full_name as string}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{guest?.email as string}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Telefono</dt>
              <dd className="text-slate-900">
                {(guest?.phone as string) || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Nacionalidad</dt>
              <dd className="text-slate-900">
                {(guest?.nationality as string) || "-"}
              </dd>
            </div>
            {booking.special_requests && (
              <div>
                <dt className="text-slate-500 mb-1">Peticiones especiales</dt>
                <dd className="text-slate-900 bg-slate-50 rounded-lg p-3">
                  {booking.special_requests as string}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Financiero section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Financiero</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-slate-900">
                {formatCurrency(
                  booking.subtotal as number,
                  org.currency
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Extras</dt>
              <dd className="text-slate-900">
                {formatCurrency(
                  booking.extras_total as number,
                  org.currency
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Impuestos</dt>
              <dd className="text-slate-900">
                {formatCurrency(booking.taxes as number, org.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="font-medium text-slate-900">Total</dt>
              <dd className="font-bold text-slate-900">
                {formatCurrency(booking.total as number, org.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">
                Comision ({booking.commission_rate as number}%)
              </dt>
              <dd className="text-red-600">
                -{formatCurrency(
                  booking.commission_amount as number,
                  org.currency
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="font-medium text-slate-900">Neto hotel</dt>
              <dd className="font-bold text-green-700">
                {formatCurrency(
                  booking.net_hotel as number,
                  org.currency
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Habitacion section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Habitacion</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Tipo</dt>
              <dd className="font-medium text-slate-900">
                {roomType?.name as string}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Habitacion asignada</dt>
              <dd className="text-slate-900">
                {room
                  ? (room.room_number as string)
                  : (
                    <span className="text-amber-600">Sin asignar</span>
                  )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
