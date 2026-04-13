import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { booking_id, amount } = await request.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id requerido" },
        { status: 400 }
      );
    }

    // Fetch booking
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, organization_id, stripe_payment_intent_id, total, payment_status"
      )
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verify user belongs to the org
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", booking.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No hay pago registrado para esta reserva" },
        { status: 400 }
      );
    }

    if (booking.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Solo se pueden reembolsar reservas pagadas" },
        { status: 400 }
      );
    }

    // Create refund
    const refundParams: {
      payment_intent: string;
      reverse_transfer: boolean;
      refund_application_fee: boolean;
      amount?: number;
    } = {
      payment_intent: booking.stripe_payment_intent_id,
      reverse_transfer: true,
      refund_application_fee: true,
    };

    // Partial refund if amount specified
    if (amount && amount < booking.total) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    const refundAmount = refund.amount / 100;
    const isFullRefund = refundAmount >= booking.total;

    const updateData: Record<string, unknown> = {
      payment_status: isFullRefund ? "refunded" : "partial_refund",
      refund_amount: refundAmount,
      stripe_refund_id: refund.id,
    };

    if (isFullRefund) {
      updateData.status = "cancelled";
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = "Reembolso completo";
    }

    await supabase.from("bookings").update(updateData).eq("id", booking.id);

    return NextResponse.json({
      success: true,
      refund_id: refund.id,
      refund_amount: refundAmount,
      is_full_refund: isFullRefund,
    });
  } catch (err) {
    console.error("Stripe refund error:", err);
    return NextResponse.json(
      { error: "Error al procesar el reembolso" },
      { status: 500 }
    );
  }
}
