import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  BedDouble,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { HotelDetailActions } from "./hotel-detail-actions";

export default async function AdminHotelDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const supabase = createAdminClient();

  const { data: hotel } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", hotelId)
    .single();

  if (!hotel) redirect("/admin/hotels");

  const [
    { count: totalRooms },
    { count: totalBookings },
    { data: revenueData },
    { data: commissionData },
  ] = await Promise.all([
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", hotelId),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", hotelId),
    supabase
      .from("bookings")
      .select("total")
      .eq("organization_id", hotelId)
      .eq("payment_status", "paid"),
    supabase
      .from("bookings")
      .select("commission_amount")
      .eq("organization_id", hotelId)
      .not("commission_amount", "is", null),
  ]);

  const revenue = revenueData?.reduce((sum, b) => sum + (b.total || 0), 0) ?? 0;
  const commissions = commissionData?.reduce(
    (sum, b) => sum + (b.commission_amount || 0),
    0
  ) ?? 0;

  const statusBadge: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    trial: "bg-blue-100 text-blue-800",
    suspended: "bg-red-100 text-red-800",
    onboarding: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-slate-100 text-slate-800",
  };

  const stats = [
    {
      label: "Habitaciones",
      value: totalRooms ?? 0,
      icon: BedDouble,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Reservas",
      value: totalBookings ?? 0,
      icon: CalendarCheck,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Revenue",
      value: `$${revenue.toLocaleString("es-MX")}`,
      icon: DollarSign,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Comisiones",
      value: `$${commissions.toLocaleString("es-MX")}`,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div>
      <Link
        href="/admin/hotels"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a hoteles
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {hotel.logo_url ? (
            <img
              src={hotel.logo_url}
              alt={hotel.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-purple-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{hotel.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {hotel.slug}
              </code>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusBadge[hotel.status] ?? "bg-slate-100"
                }`}
              >
                {hotel.status}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/${hotel.slug}`}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 transition"
        >
          Impersonar
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Hotel info + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotel details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">
            Información del hotel
          </h2>
          <dl className="space-y-3">
            {[
              { label: "Email", value: hotel.email },
              { label: "Teléfono", value: hotel.phone },
              { label: "Dirección", value: hotel.address },
              { label: "Ciudad", value: hotel.city },
              { label: "País", value: hotel.country },
              { label: "Moneda", value: hotel.currency },
              { label: "Plan", value: hotel.plan || "free" },
              { label: "Comisión", value: `${hotel.commission_rate ?? 5}%` },
              { label: "Estrellas", value: hotel.star_rating ? `${"★".repeat(hotel.star_rating)}` : "N/A" },
              { label: "Stripe", value: hotel.stripe_account_id || "No conectado" },
              {
                label: "Creado",
                value: new Date(hotel.created_at).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {item.value || "-"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Actions */}
        <HotelDetailActions
          hotelId={hotel.id}
          slug={hotel.slug}
          currentStatus={hotel.status}
          currentCommissionRate={hotel.commission_rate ?? 5}
        />
      </div>
    </div>
  );
}
