import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              confirmed_at: new Date().toISOString(),
            })
            .eq("id", bookingId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          await supabase
            .from("bookings")
            .update({ payment_status: "failed" })
            .eq("id", bookingId);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          const { data: booking } = await supabase
            .from("bookings")
            .select("id, total")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (booking) {
            const refundedAmount = charge.amount_refunded / 100;
            const isFullRefund = refundedAmount >= booking.total;

            await supabase
              .from("bookings")
              .update({
                payment_status: isFullRefund ? "refunded" : "partial_refund",
                refund_amount: refundedAmount,
                stripe_refund_id:
                  charge.refunds?.data?.[0]?.id || null,
              })
              .eq("id", booking.id);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
