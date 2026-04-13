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
        className="border-b bg-white sticky top-0 z-50 shadow-sm"
        style={{ borderBottomColor: accentColor + "30" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={org.name}
              width={40}
              height={40}
              className="rounded-lg object-contain w-9 h-9 sm:w-10 sm:h-10"
            />
          ) : (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accentColor + "15" }}
            >
              <Hotel className="h-5 w-5" style={{ color: accentColor }} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 leading-tight text-sm sm:text-base truncate">
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

      <footer className="border-t border-border bg-white py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          {(org.phone || org.email || org.address) && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              {org.phone && <span>{org.phone}</span>}
              {org.email && <span>{org.email}</span>}
              {org.address && <span>{org.address}</span>}
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <span>Powered by </span>
            <a
              href="https://hotelos.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              HotelOS
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
