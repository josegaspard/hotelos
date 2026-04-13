"use client";

import { useState } from "react";
import { CancelledSuccess } from "./cancelled-success";

interface CancelFormProps {
  bookingId: string;
  bookingCode: string;
  slug: string;
  refundAmount: number;
  refundPercentage: number;
  policy: string;
  currency: string;
  hotelName: string;
  hotelEmail: string;
}

export function CancelForm({
  bookingId,
  bookingCode,
  slug,
  refundAmount,
  refundPercentage,
  policy,
  currency,
  hotelName,
  hotelEmail,
}: CancelFormProps) {
  const [step, setStep] = useState<"initial" | "confirm" | "loading" | "success" | "error">("initial");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultRefundAmount, setResultRefundAmount] = useState(0);

  async function handleConfirm() {
    setStep("loading");

    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          booking_code: bookingCode,
          reason: reason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Error al cancelar la reserva");
        setStep("error");
        return;
      }

      setResultRefundAmount(data.refund_amount || 0);
      setStep("success");
    } catch {
      setErrorMessage("Error de conexi\u00f3n. Int\u00e9ntalo de nuevo.");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <CancelledSuccess
        refundAmount={resultRefundAmount}
        currency={currency}
        slug={slug}
        hotelName={hotelName}
        hotelEmail={hotelEmail}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Reason textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Motivo de cancelaci&oacute;n (opcional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Cu&eacute;ntanos por qu&eacute; deseas cancelar..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      {/* Refund summary */}
      {refundAmount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          Se reembolsar&aacute;n <span className="font-semibold">${refundAmount.toFixed(2)} {currency}</span> ({refundPercentage}%) a tu m&eacute;todo de pago original.
        </div>
      )}
      {refundAmount === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
          No se aplicar&aacute; reembolso seg&uacute;n la pol&iacute;tica <span className="font-medium">{policy}</span>.
        </div>
      )}

      {/* Error message */}
      {step === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Action buttons */}
      {step === "initial" || step === "error" ? (
        <button
          onClick={() => setStep("confirm")}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Confirmar cancelaci&oacute;n
        </button>
      ) : step === "confirm" ? (
        <div>
          <p className="text-sm text-slate-700 mb-3 font-medium text-center">
            &iquest;Est&aacute;s seguro? Esta acci&oacute;n no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              S&iacute;, cancelar reserva
            </button>
            <button
              onClick={() => setStep("initial")}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              No, mantener reserva
            </button>
          </div>
        </div>
      ) : step === "loading" ? (
        <div className="flex items-center justify-center py-3">
          <svg className="animate-spin h-5 w-5 text-red-600 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-600">Procesando cancelaci&oacute;n...</span>
        </div>
      ) : null}
    </div>
  );
}
