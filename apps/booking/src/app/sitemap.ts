import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: orgs } = await supabase
    .from("organizations")
    .select("slug, updated_at")
    .eq("status", "active");

  const baseUrl =
    "https://hotelos-booking-josegaspards-projects.vercel.app";

  const entries: MetadataRoute.Sitemap = [];

  for (const org of orgs || []) {
    entries.push({
      url: `${baseUrl}/${org.slug}`,
      lastModified: org.updated_at || new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    entries.push({
      url: `${baseUrl}/${org.slug}/search`,
      lastModified: org.updated_at || new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
