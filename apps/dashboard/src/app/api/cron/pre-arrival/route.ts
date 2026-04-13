import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("checkin_date", tomorrowStr)
      .eq("status", "confirmed");

    if (bookingsError) {
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        sent: 0,
        message: "No bookings found for tomorrow",
      });
    }

    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const [{ data: guest }, { data: roomType }, { data: organization }] =
          await Promise.all([
            supabase
              .from("guests")
              .select("*")
              .eq("id", booking.guest_id)
              .single(),
            supabase
              .from("room_types")
              .select("*")
              .eq("id", booking.room_type_id)
              .single(),
            supabase
              .from("organizations")
              .select("*")
              .eq("id", booking.organization_id)
              .single(),
          ]);

        if (!guest || !roomType || !organization) continue;

        try {
          const { sendPreArrivalReminder } = await import("@hotelos/email");
          await sendPreArrivalReminder({
            booking,
            guest,
            roomType,
            organization,
          });
        } catch {
          // Email sending optional — log and continue
        }

        await supabase.from("email_logs").insert({
          organization_id: booking.organization_id,
          booking_id: booking.id,
          recipient: guest.email,
          template: "pre_arrival",
          subject: `Te esperamos mañana - ${organization.name}`,
          status: "sent",
        });

        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: bookings.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}
