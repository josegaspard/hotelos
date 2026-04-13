import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@hotelos/shared/types";
import { SettingsForm } from "./settings-form";
import { StripeConnect } from "./stripe-connect";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Configuración del hotel
      </h1>
      <SettingsForm organization={org as Organization} />
      <StripeConnect organization={org as Organization} />
    </div>
  );
}
