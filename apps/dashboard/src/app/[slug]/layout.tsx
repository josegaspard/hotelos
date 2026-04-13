import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "./sidebar";

export default async function HotelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  if (!membership) redirect("/");

  // Redirect to onboarding if org is still in onboarding status
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";
  const isOnboardingPage = pathname.includes(`/${slug}/onboarding`);

  if (org.status === "onboarding" && !isOnboardingPage) {
    redirect(`/${slug}/onboarding`);
  }

  // If on onboarding page, render without sidebar
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        slug={slug}
        hotelName={org.name}
        role={membership.role}
        logoUrl={org.logo_url}
        organizationId={org.id}
      />
      <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
