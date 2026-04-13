import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CANCELLATION_POLICIES } from "@hotelos/shared/constants";
import { CancelForm } from "./cancel-form";

export const dynamic = "force-dynamic";

export default async function CancelBookingPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const supabase = await createClient();

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!org) notFound();

  // Fetch booking with relations
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, guest:guests(*), room_type:room_types(*)")
    .eq("booking_code", code)
    .eq("organization_id", org.id)
    .single();

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Reserva no encontrada</h1>
          <p className="text-slate-500">No se encontr&oacute; una reserva con el c&oacute;digo proporcionado.</p>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Reserva ya cancelada</h1>
          <p className="text-slate-500">Esta reserva fue cancelada previamente.</p>
        </div>
      </div>
    );
  }

  if (booking.status === "checked_in" || booking.status === "checked_out") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">No se puede cancelar</h1>
          <p className="text-slate-500">Esta reserva ya no puede ser cancelada.</p>
        </div>
      </div>
    );
  }

  // Calculate refund via RPC
  const { data: refundInfo } = await supabase.rpc("calculate_refund", {
    p_booking_id: booking.id,
  });

  const refundData = refundInfo || {
    refund_percentage: 0,
    refund_amount: 0,
    total_paid: booking.total,
    policy: "No refund",
    hours_until_checkin: 0,
    cancellation_type: org.cancellation_type || "flexible",
  };

  const cancellationType = (org.cancellation_type || "flexible") as keyof typeof CANCELLATION_POLICIES;
  const policyInfo = CANCELLATION_POLICIES[cancellationType] || CANCELLATION_POLICIES.flexible;

  // Build policy description
  let policyExplanation = "";
  if (cancellationType === "flexible") {
    policyExplanation = `Cancelaci\u00f3n gratuita hasta ${org.cancellation_free_hours || 48}h antes del check-in. Reembolso parcial del ${org.cancellation_partial_refund_pct || 50}% hasta ${org.cancellation_partial_hours || 24}h antes.`;
  } else if (cancellationType === "moderate") {
    policyExplanation = "Cancelaci\u00f3n gratuita hasta 72h antes del check-in. Reembolso del 50% hasta 24h antes.";
  } else {
    policyExplanation = "Cancelaci\u00f3n gratuita hasta 7 d\u00edas antes del check-in. Reembolso del 50% hasta 72h antes.";
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Cancelar reserva</h1>

      {/* Booking details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Detalles de la reserva</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">C&oacute;digo</dt>
            <dd className="font-mono font-medium text-slate-900">{booking.booking_code}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tipo de habitaci&oacute;n</dt>
            <dd className="text-slate-900">{booking.room_type?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Check-in</dt>
            <dd className="text-slate-900">
              {format(new Date(booking.checkin_date), "d MMM yyyy", { locale: es })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Check-out</dt>
            <dd className="text-slate-900">
              {format(new Date(booking.checkout_date), "d MMM yyyy", { locale: es })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Noches</dt>
            <dd className="text-slate-900">{booking.nights}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <dt className="text-slate-500 font-medium">Total pagado</dt>
            <dd className="font-semibold text-slate-900">
              ${Number(refundData.total_paid).toFixed(2)} {booking.currency}
            </dd>
          </div>
        </dl>
      </div>

      {/* Cancellation policy */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Pol&iacute;tica de cancelaci&oacute;n: {policyInfo.label}
        </h2>
        <p className="text-sm text-slate-500 mb-4">{policyExplanation}</p>

        <div className="bg-slate-50 rounded-lg p-4">
          {Number(refundData.refund_amount) > 0 ? (
            <div>
              <p className="text-sm font-medium text-green-700">
                Recibir&aacute;s un reembolso de ${Number(refundData.refund_amount).toFixed(2)} ({Number(refundData.refund_percentage)}%)
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Faltan {Math.round(Number(refundData.hours_until_checkin))} horas para el check-in
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-red-600">No se aplica reembolso</p>
              <p className="text-xs text-slate-500 mt-1">
                Seg&uacute;n la pol&iacute;tica de cancelaci&oacute;n, no es posible obtener un reembolso en este momento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel form */}
      <CancelForm
        bookingId={booking.id}
        bookingCode={booking.booking_code}
        slug={slug}
        refundAmount={Number(refundData.refund_amount)}
        refundPercentage={Number(refundData.refund_percentage)}
        policy={policyInfo.label}
        currency={booking.currency}
        hotelName={org.name}
        hotelEmail={org.email}
      />
    </div>
  );
}
