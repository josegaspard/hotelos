import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@hotelos/shared/utils";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PayoutsSection } from "./payouts-section";

const periods = [
  { key: "month", label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
  { key: "90days", label: "Ultimos 90 dias" },
];

function getPeriodDates(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  if (period === "last_month") {
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 86400000);
    const firstOfPrevMonth = new Date(
      lastOfPrevMonth.getFullYear(),
      lastOfPrevMonth.getMonth(),
      1
    );
    return {
      from: firstOfPrevMonth.toISOString().split("T")[0],
      to: lastOfPrevMonth.toISOString().split("T")[0],
    };
  }

  if (period === "90days") {
    const from = new Date(now.getTime() - 90 * 86400000);
    return { from: from.toISOString().split("T")[0], to };
  }

  // Default: this month
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: firstOfMonth.toISOString().split("T")[0], to };
}

export default async function FinancesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period: periodParam } = await searchParams;
  const activePeriod = periodParam || "month";
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency, stripe_account_id, stripe_onboarding_complete")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  const { from, to } = getPeriodDates(activePeriod);

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, total, commission_amount, net_hotel, created_at, payment_status, guests(full_name)"
    )
    .eq("organization_id", org.id)
    .eq("payment_status", "paid")
    .gte("created_at", `${from}T00:00:00`)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false });

  let totalRevenue = 0;
  let totalCommission = 0;
  let totalNet = 0;

  if (bookings) {
    for (const b of bookings) {
      totalRevenue += (b.total as number) || 0;
      totalCommission += (b.commission_amount as number) || 0;
      totalNet += (b.net_hotel as number) || 0;
    }
  }

  const stats = [
    {
      label: "Ingresos brutos",
      value: formatCurrency(totalRevenue, org.currency),
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Comisiones",
      value: formatCurrency(totalCommission, org.currency),
      icon: TrendingDown,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Ingresos netos",
      value: formatCurrency(totalNet, org.currency),
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Finanzas</h1>
      </div>

      {/* Period selector */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          {periods.map((p) => (
            <Link
              key={p.key}
              href={`/${slug}/finances?period=${p.key}`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activePeriod === p.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      {/* Transactions table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Transacciones</h2>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Fecha
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Codigo
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Huesped
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Total
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Comision
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Neto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings && bookings.length > 0 ? (
                bookings.map((b: Record<string, unknown>) => (
                  <tr
                    key={b.id as string}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(b.created_at as string).toLocaleDateString(
                        "es-MX"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${slug}/bookings/${b.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {b.booking_code as string}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {(b.guests as Record<string, unknown>)
                        ?.full_name as string}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(b.total as number, org.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      -{formatCurrency(
                        b.commission_amount as number,
                        org.currency
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {formatCurrency(b.net_hotel as number, org.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No hay transacciones en este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Stripe Payouts */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Pagos de Stripe
        </h2>
        <PayoutsSection
          organizationId={org.id}
          stripeConnected={
            !!org.stripe_account_id && !!org.stripe_onboarding_complete
          }
          currency={org.currency}
        />
      </div>
    </div>
  );
}
