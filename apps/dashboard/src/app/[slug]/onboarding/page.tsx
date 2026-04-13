import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) redirect("/");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership || membership.role !== "owner") redirect("/");

  if (org.status !== "onboarding") {
    redirect(`/${slug}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingWizard org={org} slug={slug} />
    </div>
  );
}
