import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWidgetScript } from "@/lib/widget-template";

const BOOKING_URL = "https://hotelos-booking-josegaspards-projects.vercel.app";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("primary_color, status")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!org) {
    return new NextResponse("// Hotel not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const script = getWidgetScript(slug, org.primary_color || "#1e40af", BOOKING_URL);

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
