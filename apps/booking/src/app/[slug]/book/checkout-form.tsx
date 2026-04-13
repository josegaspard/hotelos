"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, AlertCircle } from "lucide-react";

interface CheckoutFormProps {
  bookingId: string;
  clientSecret: string;
  total: number;
  currency: string;
  accentColor?: string;
  returnUrl: string;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function CheckoutForm({
  total,
  currency,
  accentColor = "#1e40af",
  returnUrl,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // If confirmPayment returns, it means there was an error
    // (successful payments redirect to return_url)
    if (submitError) {
      setError(
        submitError.message || "Error al procesar el pago. Intenta de nuevo."
      );
    }

    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: accentColor }}
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando pago...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pagar {formatAmount(total, currency)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Pago seguro procesado por Stripe
      </p>
    </form>
  );
}
