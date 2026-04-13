"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  Calendar,
  CreditCard,
} from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
  created: number;
}

interface BalanceAmount {
  amount: number;
  currency: string;
}

interface PayoutsData {
  payouts: { data: Payout[] };
  balance: {
    available: BalanceAmount[];
    pending: BalanceAmount[];
  };
}

interface PayoutsSectionProps {
  organizationId: string;
  stripeConnected: boolean;
  currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusLabels: Record<string, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "bg-green-100 text-green-700" },
  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  in_transit: {
    label: "En transito",
    className: "bg-blue-100 text-blue-700",
  },
  canceled: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  failed: { label: "Fallido", className: "bg-red-100 text-red-700" },
};

export function PayoutsSection({
  organizationId,
  stripeConnected,
  currency,
}: PayoutsSectionProps) {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripeConnected) {
      setLoading(false);
      return;
    }

    async function fetchPayouts() {
      try {
        const res = await fetch(
          `/api/stripe/payouts?organization_id=${organizationId}`
        );
        if (!res.ok) throw new Error("Error al cargar datos");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar pagos"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPayouts();
  }, [organizationId, stripeConnected]);

  if (!stripeConnected) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">
          Conecta Stripe para recibir pagos
        </p>
        <p className="text-sm text-slate-400">
          Ve a Configuracion para conectar tu cuenta de Stripe y empezar a
          recibir pagos de tus huespedes.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const available =
    data?.balance.available.find((b) => b.currency === currency.toLowerCase())
      ?.amount || 0;
  const pending =
    data?.balance.pending.find((b) => b.currency === currency.toLowerCase())
      ?.amount || 0;
  const payouts = data?.payouts.data || [];

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Saldo disponible</span>
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(available, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Saldo pendiente</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(pending, currency)}
          </p>
        </div>
      </div>

      {/* Recent payouts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Pagos recientes</h3>
        </div>
        {payouts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {payouts.map((payout) => {
              const statusInfo = statusLabels[payout.status] || {
                label: payout.status,
                className: "bg-slate-100 text-slate-600",
              };
              return (
                <div
                  key={payout.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(payout.amount, payout.currency)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Llega: {formatDate(payout.arrival_date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-slate-400 text-sm">
            No hay pagos recientes
          </div>
        )}
      </div>
    </div>
  );
}
