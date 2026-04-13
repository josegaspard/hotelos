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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center space-y-5">
      {/* Green checkmark */}
      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900">Reserva cancelada exitosamente</h2>

      {refundAmount > 0 ? (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-700">
              Se ha procesado un reembolso de{" "}
              <span className="font-bold text-green-800">
                ${refundAmount.toFixed(2)} {currency}
              </span>
            </p>
          </div>
          <p className="text-xs text-gray-400">
            El reembolso puede tardar entre 5 y 10 dias habiles en reflejarse en tu estado de cuenta.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Tu reserva ha sido cancelada. No se aplico reembolso segun la politica del hotel.
        </p>
      )}

      {/* Hotel contact */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-400 mb-1">Tienes preguntas? Contacta al hotel:</p>
        <p className="text-sm font-medium text-gray-700">{hotelName}</p>
        <a href={`mailto:${hotelEmail}`} className="text-sm text-blue-600 hover:underline">
          {hotelEmail}
        </a>
      </div>

      {/* New booking link */}
      <Link
        href={`/${slug}`}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 min-h-[48px]"
      >
        Hacer nueva reserva
      </Link>
    </div>
  );
}
