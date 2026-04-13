import { createClient } from "@/lib/supabase/server";
import { HousekeepingCard } from "./housekeeping-card";

export default async function HousekeepingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*, room_types(name)")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("floor")
    .order("room_number");

  // Group rooms by floor
  const floors = new Map<string, typeof rooms>();
  if (rooms) {
    for (const room of rooms) {
      const floor = (room.floor as string) || "Sin piso";
      if (!floors.has(floor)) {
        floors.set(floor, []);
      }
      floors.get(floor)!.push(room);
    }
  }

  const statusCounts = {
    dirty: 0,
    in_progress: 0,
    clean: 0,
    inspected: 0,
  };

  if (rooms) {
    for (const room of rooms) {
      const hs = room.housekeeping_status as keyof typeof statusCounts;
      if (hs in statusCounts) statusCounts[hs]++;
    }
  }

  const statusColorsDot: Record<string, string> = {
    dirty: "bg-red-500",
    in_progress: "bg-yellow-500",
    clean: "bg-green-500",
    inspected: "bg-blue-500",
  };

  const statusLabels: Record<string, string> = {
    dirty: "Sucias",
    in_progress: "En progreso",
    clean: "Limpias",
    inspected: "Inspeccionadas",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Housekeeping</h1>

      {/* Summary cards - status legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
        {(["dirty", "in_progress", "clean", "inspected"] as const).map(
          (status) => (
            <div
              key={status}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${statusColorsDot[status]}`}
                />
                <span className="text-sm text-slate-500">
                  {statusLabels[status]}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {statusCounts[status]}
              </p>
            </div>
          )
        )}
      </div>

      {/* Rooms grid grouped by floor */}
      {Array.from(floors.entries()).map(([floor, floorRooms]) => (
        <div key={floor} className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {floor === "Sin piso" ? floor : `Piso ${floor}`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {floorRooms!.map((room: Record<string, unknown>) => (
              <HousekeepingCard
                key={room.id as string}
                roomId={room.id as string}
                roomNumber={room.room_number as string}
                roomTypeName={
                  (room.room_types as Record<string, unknown>)?.name as string
                }
                status={room.status as string}
                housekeepingStatus={room.housekeeping_status as string}
              />
            ))}
          </div>
        </div>
      ))}

      {(!rooms || rooms.length === 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No hay habitaciones configuradas
        </div>
      )}
    </div>
  );
}
