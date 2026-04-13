import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { RoomType, Room } from "@hotelos/shared/types";
import { RoomTypeForm } from "./room-type-form";
import { RoomsList } from "./rooms-list";

export default async function RoomTypeDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency")
    .eq("slug", slug)
    .single();

  if (!org) redirect("/");

  const { data: roomType } = await supabase
    .from("room_types")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.id)
    .single();

  if (!roomType) redirect(`/${slug}/rooms`);

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("room_type_id", id)
    .eq("organization_id", org.id)
    .order("room_number", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/rooms`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a habitaciones
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {(roomType as RoomType).name}
        </h1>
      </div>

      <div className="space-y-8">
        <RoomTypeForm
          roomType={roomType as RoomType}
          slug={slug}
          currency={org.currency}
        />

        <RoomsList
          rooms={(rooms ?? []) as Room[]}
          roomTypeId={id}
          organizationId={org.id}
          slug={slug}
        />
      </div>
    </div>
  );
}
