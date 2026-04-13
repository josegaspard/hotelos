import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HotelStatusToggle } from "./hotel-status-toggle";

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "active") query = query.eq("status", "active");
  else if (filter === "trial") query = query.eq("status", "trial");
  else if (filter === "suspended") query = query.eq("status", "suspended");

  const { data: hotels } = await query;

  // Get room counts and booking counts per hotel
  const hotelIds = (hotels || []).map((h) => h.id);

  const [{ data: roomCounts }, { data: bookingCounts }] = await Promise.all([
    supabase
      .from("rooms")
      .select("organization_id")
      .in("organization_id", hotelIds.length > 0 ? hotelIds : [""]),
    supabase
      .from("bookings")
      .select("organization_id")
      .in("organization_id", hotelIds.length > 0 ? hotelIds : [""]),
  ]);

  const roomCountMap: Record<string, number> = {};
  (roomCounts || []).forEach((r) => {
    roomCountMap[r.organization_id] = (roomCountMap[r.organization_id] || 0) + 1;
  });

  const bookingCountMap: Record<string, number> = {};
  (bookingCounts || []).forEach((b) => {
    bookingCountMap[b.organization_id] = (bookingCountMap[b.organization_id] || 0) + 1;
  });

  const tabs = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "trial", label: "Trial" },
    { value: "suspended", label: "Suspendidos" },
  ];

  const statusBadge: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    trial: "bg-blue-100 text-blue-800",
    suspended: "bg-red-100 text-red-800",
    onboarding: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-slate-100 text-slate-800",
  };

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Hoteles</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona todos los hoteles de la plataforma
        </p>
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/hotels${tab.value === "all" ? "" : `?filter=${tab.value}`}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === tab.value || (tab.value === "all" && !filter)
                ? "bg-purple-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Hotel
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Slug
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Comisión %
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Estado
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Rooms
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Reservas
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Creado
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(hotels || []).map((hotel) => (
                <tr key={hotel.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 text-sm">
                      {hotel.name}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {hotel.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {hotel.plan || "free"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {hotel.commission_rate ?? 5}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusBadge[hotel.status] ?? "bg-slate-100"
                      }`}
                    >
                      {hotel.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm text-slate-600">
                      {roomCountMap[hotel.id] || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm text-slate-600">
                      {bookingCountMap[hotel.id] || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">
                      {new Date(hotel.created_at).toLocaleDateString("es-MX")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${hotel.slug}`}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Ver panel
                      </Link>
                      <Link
                        href={`/admin/hotels/${hotel.id}`}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Detalles
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hotels || hotels.length === 0) && (
          <div className="p-12 text-center text-slate-400">
            No hay hoteles con este filtro
          </div>
        )}
      </div>
    </div>
  );
}
