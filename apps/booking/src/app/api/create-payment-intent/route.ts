import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { booking_id, organization_id } = await request.json();

    if (!booking_id || !organization_id) {
      return NextResponse.json(
        { error: "booking_id y organization_id requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organizacion no encontrada" },
        { status: 404 }
      );
    }

    if (!org.stripe_account_id || !org.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "El hotel no tiene Stripe configurado" },
        { status: 400 }
      );
    }

    // Fetch booking
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, booking_code, total, currency, commission_amount, status, stripe_payment_intent_id"
      )
      .eq("id", booking_id)
      .eq("organization_id", organization_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json(
        { error: "La reserva no esta pendiente de pago" },
        { status: 400 }
      );
    }

    // If already has a payment intent, return its client secret
    if (booking.stripe_payment_intent_id) {
      const existingPI = await stripe.paymentIntents.retrieve(
        booking.stripe_payment_intent_id
      );
      return NextResponse.json({ clientSecret: existingPI.client_secret });
    }

    // Create PaymentIntent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total * 100),
      currency: booking.currency.toLowerCase(),
      application_fee_amount: Math.round(booking.commission_amount * 100),
      transfer_data: {
        destination: org.stripe_account_id,
      },
      metadata: {
        booking_id: booking.id,
        organization_id: organization_id,
        booking_code: booking.booking_code,
      },
    });

    // Save payment intent ID
    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", booking.id);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Create payment intent error:", err);
    return NextResponse.json(
      { error: "Error al crear el intento de pago" },
      { status: 500 }
    );
  }
}
