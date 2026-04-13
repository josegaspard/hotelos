import { notFound } from "next/navigation";
import Image from "next/image";
import { Hotel } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@hotelos/shared/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, description, logo_url, cover_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!org) return { title: "Hotel no encontrado" };

  const title = `${org.name} — Reserva en linea`;
  const description = org.description || `Reserva en ${org.name}`;
  const ogImage = org.logo_url || org.cover_url || undefined;

  return {
    title,
    description,
    viewport: "width=device-width, initial-scale=1",
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Organization>();

  if (!org) notFound();

  const accentColor = org.primary_color || "#1e40af";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header
        className="border-b bg-white"
        style={{ borderBottomColor: accentColor + "30" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={org.name}
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accentColor + "15" }}
            >
              <Hotel className="h-5 w-5" style={{ color: accentColor }} />
            </div>
          )}
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">
              {org.name}
            </h2>
            {org.star_rating && (
              <div className="flex gap-0.5">
                {Array.from({ length: org.star_rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xs">
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-white py-6 text-center text-sm text-muted-foreground">
        <span>Powered by </span>
        <span className="font-semibold text-gray-700">HotelOS</span>
      </footer>
    </div>
  );
}
