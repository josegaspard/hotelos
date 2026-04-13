import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type EmailType =
  | "booking_confirmation"
  | "new_booking_hotel"
  | "pre_arrival"
  | "cancellation"
  | "checkout_review"
  | "hotel_welcome";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, booking_id, organization_id, refund_amount, refund_percentage } =
      body as {
        type: EmailType;
        booking_id?: string;
        organization_id: string;
        refund_amount?: number;
        refund_percentage?: number;
      };

    if (!type || !organization_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDb();
    const email = await import("@hotelos/email");

    const { data: organization } = await db
      .from("organizations")
      .select("*")
      .eq("id", organization_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (type === "hotel_welcome") {
      const result = await email.sendHotelWelcome({ organization });
      await logEmail(db, organization_id, null, organization.email, "hotel_welcome", "Bienvenido a HotelOS");
      return NextResponse.json({ success: true, id: result.data?.id });
    }

    if (!booking_id) {
      return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    }

    const [{ data: booking }, { data: guest }, { data: roomType }] =
      await Promise.all([
        db.from("bookings").select("*").eq("id", booking_id).single(),
        db
          .from("bookings")
          .select("guest_id")
          .eq("id", booking_id)
          .single()
          .then(async (r) =>
            r.data
              ? db.from("guests").select("*").eq("id", r.data.guest_id).single()
              : { data: null }
          ),
        db
          .from("bookings")
          .select("room_type_id")
          .eq("id", booking_id)
          .single()
          .then(async (r) =>
            r.data
              ? db.from("room_types").select("*").eq("id", r.data.room_type_id).single()
              : { data: null }
          ),
      ]);

    if (!booking || !guest || !roomType) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const data = { booking, guest, roomType, organization };
    let toEmail = guest.email;
    let subject = "";

    switch (type) {
      case "booking_confirmation":
        await email.sendBookingConfirmation(data);
        subject = `Reserva confirmada - ${organization.name}`;
        break;
      case "new_booking_hotel":
        await email.sendNewBookingToHotel(data);
        toEmail = organization.email;
        subject = `Nueva reserva ${booking.booking_code}`;
        break;
      case "pre_arrival":
        await email.sendPreArrivalReminder(data);
        subject = `Te esperamos mañana - ${organization.name}`;
        break;
      case "cancellation":
        await email.sendCancellationConfirmation({
          ...data,
          refundAmount: refund_amount ?? booking.refund_amount ?? 0,
          refundPercentage: refund_percentage ?? 100,
        });
        subject = `Reserva cancelada - ${booking.booking_code}`;
        break;
      case "checkout_review":
        await email.sendCheckoutReview(data);
        subject = `Gracias por tu estancia - ${organization.name}`;
        break;
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    await logEmail(db, organization_id, booking_id, toEmail, type, subject);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Email] Error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: String(error) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logEmail(db: any, orgId: string, bookingId: string | null, recipient: string, template: string, subject: string) {
  try {
    await db.from("email_logs").insert({
      organization_id: orgId,
      booking_id: bookingId,
      recipient,
      template,
      subject,
      status: "sent",
    });
  } catch {
    // non-critical
  }
}
