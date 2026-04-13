import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BedDouble, ChevronRight } from "lucide-react";
import { formatCurrency } from "@hotelos/shared/utils";
import { AMENITY_LABELS, ROOM_STATUS_LABELS } from "@hotelos/shared/constants";
import type { RoomType, Room } from "@hotelos/shared/types";

const statusDotColor: Record<string, string> = {
  available: "bg-green-500",
  occupied: "bg-blue-500",
  cleaning: "bg-yellow-500",
  maintenance: "bg-orange-500",
  blocked: "bg-red-500",
};

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency")
    .eq("slug", slug)
    .single();

  if (!org) redirect("/");

  const { data: roomTypes } = await supabase
    .from("room_types")
    .select("*")
    .eq("organization_id", org.id)
    .order("sort_order", { ascending: true });

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("organization_id", org.id)
    .order("room_number", { ascending: true });

  const roomsByType: Record<string, Room[]> = {};
  (rooms ?? []).forEach((room: Room) => {
    if (!roomsByType[room.room_type_id]) {
      roomsByType[room.room_type_id] = [];
    }
    roomsByType[room.room_type_id].push(room);
  });

  const bedTypeLabel: Record<string, string> = {
    king: "King",
    queen: "Queen",
    double: "Doble",
    twin: "Twin",
    single: "Individual",
    bunk: "Litera",
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
        <Link href={`/${slug}`} className="hover:text-slate-600 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Habitaciones</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Habitaciones</h1>
        <Link
          href={`/${slug}/rooms/new`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar tipo
        </Link>
      </div>

      {roomTypes && roomTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(roomTypes as RoomType[]).map((rt) => {
            const typeRooms = roomsByType[rt.id] ?? [];
            const activeRooms = typeRooms.filter((r) => r.is_active).length;

            return (
              <div key={rt.id} className="bg-white rounded-xl border border-slate-200">
                <Link
                  href={`/${slug}/rooms/${rt.id}`}
                  className="block p-5 hover:bg-slate-50 transition-colors rounded-t-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatCurrency(rt.base_price, org.currency)} / noche
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        rt.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rt.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Capacidad</span>
                      <p className="text-slate-700 font-medium">
                        {rt.base_occupancy}/{rt.max_occupancy} personas
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Cama</span>
                      <p className="text-slate-700 font-medium">
                        {rt.bed_type ? bedTypeLabel[rt.bed_type] ?? rt.bed_type : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Amenidades</span>
                      <p className="text-slate-700 font-medium">
                        {rt.amenities?.length ?? 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Habitaciones</span>
                      <p className="text-slate-700 font-medium">{activeRooms}</p>
                    </div>
                  </div>
                </Link>

                <div className="px-5 py-2.5 border-t border-slate-100">
                  <Link
                    href={`/${slug}/rooms/${rt.id}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Ver detalles
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {typeRooms.length > 0 && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {typeRooms.map((room) => (
                      <span
                        key={room.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200"
                        title={ROOM_STATUS_LABELS[room.status] ?? room.status}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            statusDotColor[room.status] ?? "bg-slate-400"
                          }`}
                        />
                        {room.room_number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay tipos de habitación</p>
          <p className="text-sm text-slate-400 mt-1">
            Crea tu primer tipo de habitación para empezar
          </p>
        </div>
      )}
    </div>
  );
}
