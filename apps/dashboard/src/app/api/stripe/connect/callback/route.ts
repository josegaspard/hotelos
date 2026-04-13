import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    const stripe = getStripe();
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const supabase = await createClient();

    const { data: org } = await supabase
      .from("organizations")
      .select("id, slug, stripe_account_id")
      .eq("id", orgId)
      .single();

    if (!org || !org.stripe_account_id) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check the Stripe account status
    const account = await stripe.accounts.retrieve(org.stripe_account_id);

    if (account.charges_enabled && account.payouts_enabled) {
      await supabase
        .from("organizations")
        .update({ stripe_onboarding_complete: true })
        .eq("id", org.id);
    }

    const origin = url.origin;
    return NextResponse.redirect(`${origin}/${org.slug}/settings`);
  } catch (err) {
    console.error("Stripe callback error:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
