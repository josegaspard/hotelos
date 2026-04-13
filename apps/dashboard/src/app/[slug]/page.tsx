import { createClient } from "@/lib/supabase/server";
import {
  BedDouble,
  CalendarCheck,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@hotelos/shared/utils";

export default async function DashboardPage({
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

  if (!org) return null;

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalRooms },
    { count: occupiedRooms },
    { count: todayCheckins },
    { count: todayCheckouts },
    { data: recentBookings },
    { count: totalBookings },
  ] = await Promise.all([
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("is_active", true),
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("status", "occupied"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("checkin_date", today)
      .in("status", ["confirmed", "checked_in"]),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("checkout_date", today)
      .eq("status", "checked_in"),
    supabase
      .from("bookings")
      .select("*, guests(full_name, email), room_types(name)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .in("status", ["confirmed", "checked_in"]),
  ]);

  const occupancy =
    totalRooms && totalRooms > 0
      ? Math.round(((occupiedRooms ?? 0) / totalRooms) * 100)
      : 0;

  const stats = [
    {
      label: "Ocupación",
      value: `${occupancy}%`,
      sub: `${occupiedRooms ?? 0} de ${totalRooms ?? 0} habitaciones`,
      icon: BedDouble,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Check-ins hoy",
      value: todayCheckins ?? 0,
      sub: "Llegadas programadas",
      icon: CalendarCheck,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Check-outs hoy",
      value: todayCheckouts ?? 0,
      sub: "Salidas programadas",
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Reservas activas",
      value: totalBookings ?? 0,
      sub: "Confirmadas + en casa",
      icon: DollarSign,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const statusColors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_in: "bg-green-100 text-green-800",
    checked_out: "bg-slate-100 text-slate-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
  };

  const statusLabels: Record<string, string> = {
    pending_payment: "Pendiente",
    confirmed: "Confirmada",
    checked_in: "In-House",
    checked_out: "Check-out",
    cancelled: "Cancelada",
    no_show: "No show",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs md:text-sm text-slate-500">{stat.label}</span>
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1 hidden md:block">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 md:p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Últimas reservas</h2>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <>
            {/* Desktop table view */}
            <div className="hidden md:block divide-y divide-slate-100">
              {recentBookings.map((booking: Record<string, unknown>) => (
                <div
                  key={booking.id as string}
                  className="px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {(booking.guests as Record<string, unknown>)?.full_name as string}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(booking.room_types as Record<string, unknown>)?.name as string} &middot;{" "}
                      {booking.checkin_date as string} → {booking.checkout_date as string}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(booking.total as number, org.currency)}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[booking.status as string] ?? "bg-slate-100"
                      }`}
                    >
                      {statusLabels[booking.status as string] ?? booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-slate-100">
              {recentBookings.map((booking: Record<string, unknown>) => (
                <div
                  key={booking.id as string}
                  className="px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900 text-sm">
                      {(booking.guests as Record<string, unknown>)?.full_name as string}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        statusColors[booking.status as string] ?? "bg-slate-100"
                      }`}
                    >
                      {statusLabels[booking.status as string] ?? booking.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {(booking.room_types as Record<string, unknown>)?.name as string} &middot;{" "}
                      {booking.checkin_date as string}
                    </p>
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(booking.total as number, org.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p>No hay reservas aún</p>
            <p className="text-sm mt-1">
              Las reservas aparecerán aquí cuando los huéspedes reserven
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
