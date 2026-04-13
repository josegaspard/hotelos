import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { booking_id, booking_code, reason } = await request.json();

    if (!booking_id || !booking_code) {
      return NextResponse.json(
        { error: "booking_id y booking_code son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch booking and verify code
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, organization_id, booking_code, status, payment_status, stripe_payment_intent_id, total, room_id"
      )
      .eq("id", booking_id)
      .single();

    if (!booking || booking.booking_code !== booking_code) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verify cancellable status
    if (!["pending_payment", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Esta reserva no puede ser cancelada" },
        { status: 400 }
      );
    }

    // Calculate refund
    const { data: refundInfo } = await supabase.rpc("calculate_refund", {
      p_booking_id: booking.id,
    });

    const refundAmount = refundInfo ? Number(refundInfo.refund_amount) : 0;
    const refundPercentage = refundInfo ? Number(refundInfo.refund_percentage) : 0;
    const totalPaid = refundInfo ? Number(refundInfo.total_paid) : Number(booking.total);

    let stripeRefundId: string | null = null;
    let actualRefundAmount = 0;

    // Process Stripe refund if applicable
    if (
      booking.stripe_payment_intent_id &&
      refundAmount > 0 &&
      booking.payment_status === "paid"
    ) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          reverse_transfer: true,
          refund_application_fee: true,
        });

        stripeRefundId = refund.id;
        actualRefundAmount = refund.amount / 100;
      } catch (stripeErr) {
        console.error("Stripe refund error:", stripeErr);
        return NextResponse.json(
          { error: "Error al procesar el reembolso con Stripe" },
          { status: 500 }
        );
      }
    }

    // Determine payment status
    let paymentStatus = booking.payment_status;
    if (actualRefundAmount > 0) {
      paymentStatus =
        actualRefundAmount >= totalPaid ? "refunded" : "partial_refund";
    }

    // Update booking
    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        payment_status: paymentStatus,
        refund_amount: actualRefundAmount > 0 ? actualRefundAmount : null,
        stripe_refund_id: stripeRefundId,
      })
      .eq("id", booking.id);

    // Release room if assigned
    if (booking.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", booking.room_id);
    }

    return NextResponse.json({
      success: true,
      refund_amount: actualRefundAmount,
      refund_percentage: refundPercentage,
      stripe_refund_id: stripeRefundId,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json(
      { error: "Error al cancelar la reserva" },
      { status: 500 }
    );
  }
}
