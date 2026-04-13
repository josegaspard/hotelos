import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalHotels },
    { count: totalBookings },
    { data: paidBookings },
    { data: commissionData },
    { count: monthlyBookings },
    { count: newHotelsThisMonth },
    { data: recentBookings },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("total")
      .eq("payment_status", "paid"),
    supabase
      .from("bookings")
      .select("commission_amount")
      .not("commission_amount", "is", null),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    supabase
      .from("bookings")
      .select("id, total, status, payment_status, created_at, organization_id, organizations(name), guests(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const gmv = paidBookings?.reduce((sum, b) => sum + (b.total || 0), 0) ?? 0;
  const totalCommissions = commissionData?.reduce(
    (sum, b) => sum + (b.commission_amount || 0),
    0
  ) ?? 0;

  const stats = [
    {
      label: "Hoteles activos",
      value: totalHotels ?? 0,
      icon: Building2,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total reservas",
      value: totalBookings ?? 0,
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "GMV total",
      value: `$${gmv.toLocaleString("es-MX")}`,
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Comisiones generadas",
      value: `$${totalCommissions.toLocaleString("es-MX")}`,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Reservas este mes",
      value: monthlyBookings ?? 0,
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Hoteles nuevos este mes",
      value: newHotelsThisMonth ?? 0,
      icon: Users,
      color: "bg-pink-50 text-pink-600",
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
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Vista general de toda la plataforma HotelOS
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Actividad reciente (todas las reservas)
          </h2>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentBookings.map((booking: Record<string, unknown>) => {
              const org = booking.organizations as Record<string, unknown> | null;
              const guest = booking.guests as Record<string, unknown> | null;
              return (
                <div
                  key={booking.id as string}
                  className="px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {(guest?.full_name as string) || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(org?.name as string) || "Hotel"} &middot;{" "}
                      {new Date(booking.created_at as string).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      ${((booking.total as number) || 0).toLocaleString("es-MX")}
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
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p>No hay reservas aún en la plataforma</p>
          </div>
        )}
      </div>
    </div>
  );
}
