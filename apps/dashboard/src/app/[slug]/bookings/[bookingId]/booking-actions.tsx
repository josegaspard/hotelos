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
}

export function BookingActions({
  bookingId,
  status,
  roomTypeId,
  roomId,
  organizationId,
}: BookingActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<
    { id: string; room_number: string }[]
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

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

  async function handleCancel() {
    const confirmed = window.confirm(
      "Esta seguro de cancelar esta reserva? Esta accion no se puede deshacer."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

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
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
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
    </div>
  );
}
