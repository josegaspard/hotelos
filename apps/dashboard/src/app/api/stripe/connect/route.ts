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

    const { organization_id } = await request.json();
    if (!organization_id) {
      return NextResponse.json(
        { error: "organization_id requerido" },
        { status: 400 }
      );
    }

    // Verify user belongs to the org
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, slug, email, name, stripe_account_id")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organizacion no encontrada" },
        { status: 404 }
      );
    }

    let accountId = org.stripe_account_id;

    // Create Stripe Connect Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "MX",
        email: org.email,
        business_type: "company",
        metadata: {
          organization_id: org.id,
          organization_name: org.name,
        },
      });

      accountId = account.id;

      await supabase
        .from("organizations")
        .update({ stripe_account_id: accountId })
        .eq("id", org.id);
    }

    // Create account link for onboarding
    const origin = request.headers.get("origin") || "";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/${org.slug}/settings`,
      return_url: `${origin}/api/stripe/connect/callback?org_id=${org.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json(
      { error: "Error al crear cuenta de Stripe" },
      { status: 500 }
    );
  }
}
