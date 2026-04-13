import { createClient } from "@/lib/supabase/server";
import type { RoomType } from "@hotelos/shared/types";
import { CalendarGrid } from "./calendar-grid";
import { RatePeriods } from "./rate-periods";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, currency")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  const { data: roomTypes } = await supabase
    .from("room_types")
    .select("*")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Calendario de disponibilidad
      </h1>

      {roomTypes && roomTypes.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <CalendarGrid
            roomTypes={roomTypes as RoomType[]}
            organizationId={org.id}
            currency={org.currency}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <p>No hay tipos de habitación configurados</p>
          <p className="text-sm mt-1">
            Crea tipos de habitación primero para gestionar la disponibilidad
          </p>
        </div>
      )}

      <div className="mt-8">
        <RatePeriods organizationId={org.id} />
      </div>
    </div>
  );
}
