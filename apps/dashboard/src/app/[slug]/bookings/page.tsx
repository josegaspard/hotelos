import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@hotelos/shared/utils";
import { BOOKING_STATUS_LABELS } from "@hotelos/shared/constants";
import { Plus } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-slate-100 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
};

const filterTabs = [
  { key: "all", label: "Todas", status: null },
  { key: "confirmed", label: "Confirmadas", status: "confirmed" },
  { key: "checked_in", label: "In-House", status: "checked_in" },
  { key: "checked_out", label: "Check-out", status: "checked_out" },
  { key: "cancelled", label: "Canceladas", status: "cancelled" },
];

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { slug } = await params;
  const { filter } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  let query = supabase
    .from("bookings")
    .select("*, guests(full_name, email), room_types(name)")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const activeTab = filterTabs.find((t) => t.key === filter);
  if (activeTab?.status) {
    query = query.eq("status", activeTab.status);
  }

  const { data: bookings } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
        <Link
          href={`/${slug}/bookings/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva reserva
        </Link>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
        {filterTabs.map((tab) => (
          <Link
            key={tab.key}
            href={
              tab.key === "all"
                ? `/${slug}/bookings`
                : `/${slug}/bookings?filter=${tab.key}`
            }
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              (filter === tab.key || (!filter && tab.key === "all"))
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Codigo
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Huesped
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Tipo habitacion
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Check-in
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Check-out
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Noches
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Total
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings && bookings.length > 0 ? (
                bookings.map((booking: Record<string, unknown>) => (
                  <tr
                    key={booking.id as string}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/${slug}/bookings/${booking.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {booking.booking_code as string}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {(booking.guests as Record<string, unknown>)
                        ?.full_name as string}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(booking.room_types as Record<string, unknown>)
                        ?.name as string}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.checkin_date as string}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.checkout_date as string}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.nights as number}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(
                        booking.total as number,
                        org.currency
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[booking.status as string] ??
                          "bg-slate-100"
                        }`}
                      >
                        {BOOKING_STATUS_LABELS[booking.status as string] ??
                          (booking.status as string)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No hay reservas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
