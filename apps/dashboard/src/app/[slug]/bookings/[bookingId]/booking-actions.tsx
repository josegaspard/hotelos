"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, XCircle } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  roomTypeId: string;
  roomId: string | null;
  organizationId: string;
  slug: string;
  hasStripePayment?: boolean;
}

export function BookingActions({
  bookingId,
  status,
  roomTypeId,
  roomId,
  organizationId,
  slug,
  hasStripePayment,
}: BookingActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<
    { id: string; room_number: string }[]
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [refundPreview, setRefundPreview] = useState<{
    refund_amount: number;
    refund_percentage: number;
    total_paid: number;
  } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function handleCheckin() {
    if (!roomId && !selectedRoomId) {
      // Fetch available rooms of this type
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, room_number")
        .eq("organization_id", organizationId)
        .eq("room_type_id", roomTypeId)
        .eq("status", "available")
        .eq("is_active", true)
        .order("room_number");

      if (rooms && rooms.length > 0) {
        setAvailableRooms(rooms);
        setSelectedRoomId(rooms[0].id);
        setShowRoomPicker(true);
        return;
      }
    }

    setLoading(true);
    try {
      const assignedRoomId = roomId || selectedRoomId;

      await supabase
        .from("bookings")
        .update({
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
          room_id: assignedRoomId,
        })
        .eq("id", bookingId);

      if (assignedRoomId) {
        await supabase
          .from("rooms")
          .update({ status: "occupied" })
          .eq("id", assignedRoomId);
      }

      setShowRoomPicker(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setLoading(true);
    try {
      await supabase
        .from("bookings")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (roomId) {
        await supabase
          .from("rooms")
          .update({
            status: "cleaning",
            housekeeping_status: "dirty",
          })
          .eq("id", roomId);
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelClick() {
    setCancelLoading(true);
    try {
      // Get refund preview
      const { data: refundInfo } = await supabase.rpc("calculate_refund", {
        p_booking_id: bookingId,
      });

      if (refundInfo) {
        setRefundPreview({
          refund_amount: Number(refundInfo.refund_amount),
          refund_percentage: Number(refundInfo.refund_percentage),
          total_paid: Number(refundInfo.total_paid),
        });
      } else {
        setRefundPreview({ refund_amount: 0, refund_percentage: 0, total_paid: 0 });
      }

      setShowCancelDialog(true);
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleCancelConfirm() {
    setLoading(true);
    try {
      // If there's a Stripe payment and refund amount > 0, process refund
      if (hasStripePayment && refundPreview && refundPreview.refund_amount > 0) {
        const res = await fetch(`/api/stripe/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: refundPreview.refund_amount,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Error al procesar el reembolso");
          setLoading(false);
          return;
        }
      } else {
        // No Stripe payment, just cancel
        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        // Release room if assigned
        if (roomId) {
          await supabase
            .from("rooms")
            .update({ status: "available" })
            .eq("id", roomId);
        }
      }

      setShowCancelDialog(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {showRoomPicker && (
        <div className="flex items-center gap-2">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                Hab. {room.room_number}
              </option>
            ))}
          </select>
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Confirmar Check-in"}
          </button>
          <button
            onClick={() => setShowRoomPicker(false)}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancelar
          </button>
        </div>
      )}

      {!showRoomPicker && status === "pending_payment" && (
        <button
          onClick={handleCancelClick}
          disabled={loading || cancelLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          {cancelLoading ? "Calculando..." : "Cancelar"}
        </button>
      )}

      {!showRoomPicker && status === "confirmed" && (
        <>
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Procesando..." : "Check-in"}
          </button>
          <button
            onClick={handleCancelClick}
            disabled={loading || cancelLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            {cancelLoading ? "Calculando..." : "Cancelar"}
          </button>
        </>
      )}

      {!showRoomPicker && status === "checked_in" && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loading ? "Procesando..." : "Check-out"}
        </button>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Cancelar reserva
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Esta acci&oacute;n no se puede deshacer.
            </p>

            {refundPreview && refundPreview.refund_amount > 0 && hasStripePayment ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
                Se reembolsar&aacute;n <span className="font-semibold">${refundPreview.refund_amount.toFixed(2)}</span> ({refundPreview.refund_percentage}%) al hu&eacute;sped.
              </div>
            ) : hasStripePayment && refundPreview ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-sm text-slate-600">
                No se aplicar&aacute; reembolso seg&uacute;n la pol&iacute;tica de cancelaci&oacute;n.
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-sm text-slate-600">
                Reserva sin pago en l&iacute;nea. Se cancelar&aacute; sin reembolso.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Procesando..." : "S\u00ed, cancelar"}
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                No, mantener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
