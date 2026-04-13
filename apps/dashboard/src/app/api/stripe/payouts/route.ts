import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    const stripe = getStripe();
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organization_id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id requerido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify user belongs to the org
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_account_id")
      .eq("id", organizationId)
      .single();

    if (!org?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe no configurado" },
        { status: 400 }
      );
    }

    const [payouts, balance] = await Promise.all([
      stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: org.stripe_account_id }
      ),
      stripe.balance.retrieve(
        { stripeAccount: org.stripe_account_id } as any
      ),
    ]);

    return NextResponse.json({ payouts, balance });
  } catch (err) {
    console.error("Stripe payouts error:", err);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}
