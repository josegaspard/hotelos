"use client";

import { useState } from "react";
import { ExternalLink, Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import type { Organization } from "@hotelos/shared/types";

interface StripeConnectProps {
  organization: Organization;
}

export function StripeConnect({ organization }: StripeConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected =
    organization.stripe_account_id && organization.stripe_onboarding_complete;
  const isPending =
    organization.stripe_account_id && !organization.stripe_onboarding_complete;

  async function handleConnect() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organization.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al conectar con Stripe");
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Stripe Connect</h3>
          <p className="text-sm text-slate-500">
            Recibe pagos directamente en tu cuenta bancaria
          </p>
        </div>
      </div>

      {isConnected && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800">
              Stripe conectado
            </p>
            <p className="text-xs text-green-700">
              ID de cuenta: {organization.stripe_account_id}
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium mt-1"
            >
              Dashboard de Stripe
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-800">
              Configuracion incompleta
            </p>
            <p className="text-xs text-amber-700">
              Tu cuenta de Stripe necesita completar la verificacion para poder
              recibir pagos.
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Completar configuracion
            </button>
          </div>
        </div>
      )}

      {!organization.stripe_account_id && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Conecta tu cuenta de Stripe para recibir pagos de tus huespedes
            directamente. Los pagos se transfieren automaticamente a tu cuenta
            bancaria.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Conectar con Stripe
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Comision de la plataforma: {organization.commission_rate}% por reserva
        </p>
      </div>
    </div>
  );
}
