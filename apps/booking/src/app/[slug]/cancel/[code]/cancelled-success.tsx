"use client";

import Link from "next/link";

interface CancelledSuccessProps {
  refundAmount: number;
  currency: string;
  slug: string;
  hotelName: string;
  hotelEmail: string;
}

export function CancelledSuccess({
  refundAmount,
  currency,
  slug,
  hotelName,
  hotelEmail,
}: CancelledSuccessProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      {/* Green checkmark */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Reserva cancelada exitosamente</h2>

      {refundAmount > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-slate-600">
            Se ha procesado un reembolso de{" "}
            <span className="font-semibold text-green-700">
              ${refundAmount.toFixed(2)} {currency}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            El reembolso puede tardar entre 5 y 10 d&iacute;as h&aacute;biles en reflejarse en tu estado de cuenta.
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-2">
          Tu reserva ha sido cancelada. No se aplic&oacute; reembolso seg&uacute;n la pol&iacute;tica del hotel.
        </p>
      )}

      {/* Hotel contact */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500 mb-1">&iquest;Tienes preguntas? Contacta al hotel:</p>
        <p className="text-sm font-medium text-slate-700">{hotelName}</p>
        <a href={`mailto:${hotelEmail}`} className="text-sm text-blue-600 hover:underline">
          {hotelEmail}
        </a>
      </div>

      {/* New booking link */}
      <Link
        href={`/${slug}`}
        className="inline-block mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        Hacer nueva reserva
      </Link>
    </div>
  );
}
