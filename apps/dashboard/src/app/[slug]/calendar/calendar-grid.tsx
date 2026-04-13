"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { RoomType, Availability } from "@hotelos/shared/types";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

interface CalendarGridProps {
  roomTypes: RoomType[];
  organizationId: string;
  currency: string;
}

interface CellEditor {
  roomTypeId: string;
  date: string;
  priceOverride: string;
  isClosed: boolean;
  minStay: string;
}

interface RoomCount {
  room_type_id: string;
  count: number;
}

export function CalendarGrid({
  roomTypes,
  organizationId,
  currency,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [bookingCounts, setBookingCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<CellEditor | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const roomTypeIds = roomTypes.map((rt) => rt.id);

    const [availRes, bookingsRes, roomsRes] = await Promise.all([
      supabase
        .from("availability")
        .select("*")
        .in("room_type_id", roomTypeIds)
        .gte("date", monthStart)
        .lte("date", monthEnd),
      supabase
        .from("bookings")
        .select("room_type_id, checkin_date, checkout_date")
        .eq("organization_id", organizationId)
        .in("status", ["confirmed", "checked_in"])
        .lte("checkin_date", monthEnd)
        .gte("checkout_date", monthStart),
      supabase
        .from("rooms")
        .select("room_type_id")
        .eq("organization_id", organizationId)
        .eq("is_active", true),
    ]);

    if (availRes.data) setAvailability(availRes.data as Availability[]);

    // Count rooms per room type
    const counts: Record<string, number> = {};
    (roomsRes.data ?? []).forEach((r: { room_type_id: string }) => {
      counts[r.room_type_id] = (counts[r.room_type_id] ?? 0) + 1;
    });
    setRoomCounts(counts);

    // Count bookings per room_type per date
    const bCounts: Record<string, Record<string, number>> = {};
    (bookingsRes.data ?? []).forEach(
      (b: {
        room_type_id: string;
        checkin_date: string;
        checkout_date: string;
      }) => {
        const checkin = new Date(b.checkin_date);
        const checkout = new Date(b.checkout_date);
        const rangeStart = new Date(
          Math.max(checkin.getTime(), new Date(monthStart).getTime())
        );
        const rangeEnd = new Date(
          Math.min(checkout.getTime(), new Date(monthEnd).getTime())
        );
        const bookingDays = eachDayOfInterval({
          start: rangeStart,
          end: rangeEnd,
        });
        bookingDays.forEach((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          // Don't count checkout day as occupied
          if (dateStr === b.checkout_date) return;
          if (!bCounts[b.room_type_id]) bCounts[b.room_type_id] = {};
          bCounts[b.room_type_id][dateStr] =
            (bCounts[b.room_type_id][dateStr] ?? 0) + 1;
        });
      }
    );
    setBookingCounts(bCounts);
    setLoading(false);
  }, [currentMonth, roomTypes, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getAvailability(roomTypeId: string, date: string) {
    return availability.find(
      (a) => a.room_type_id === roomTypeId && a.date === date
    );
  }

  function getAvailableCount(roomTypeId: string, date: string) {
    const avail = getAvailability(roomTypeId, date);
    if (avail?.is_closed) return -1; // closed
    const totalRooms = roomCounts[roomTypeId] ?? 0;
    const booked = bookingCounts[roomTypeId]?.[date] ?? 0;
    if (avail) {
      return Math.max(0, avail.available_count - booked);
    }
    return Math.max(0, totalRooms - booked);
  }

  function getCellColor(roomTypeId: string, date: string) {
    const count = getAvailableCount(roomTypeId, date);
    const total = roomCounts[roomTypeId] ?? 1;
    if (count === -1) return "bg-slate-100 text-slate-400";
    if (count === 0) return "bg-red-50 text-red-700";
    if (count / total <= 0.5) return "bg-amber-50 text-amber-700";
    return "bg-green-50 text-green-700";
  }

  function openEditor(roomTypeId: string, date: string) {
    const avail = getAvailability(roomTypeId, date);
    setEditor({
      roomTypeId,
      date,
      priceOverride: avail?.price_override?.toString() ?? "",
      isClosed: avail?.is_closed ?? false,
      minStay: avail?.min_stay?.toString() ?? "1",
    });
  }

  async function saveEditor() {
    if (!editor) return;
    setSaving(true);

    const payload = {
      room_type_id: editor.roomTypeId,
      date: editor.date,
      price_override: editor.priceOverride
        ? parseFloat(editor.priceOverride)
        : null,
      is_closed: editor.isClosed,
      min_stay: parseInt(editor.minStay) || 1,
      updated_at: new Date().toISOString(),
    };

    const existing = getAvailability(editor.roomTypeId, editor.date);
    if (existing) {
      await supabase
        .from("availability")
        .update(payload)
        .eq("id", existing.id);
    } else {
      await supabase.from("availability").insert({
        ...payload,
        available_count: roomCounts[editor.roomTypeId] ?? 0,
        cta_closed: false,
        ctd_closed: false,
      });
    }

    setSaving(false);
    setEditor(null);
    fetchData();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Month navigation */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 bg-white z-10 text-left px-4 py-3 font-medium text-slate-500 min-w-[160px]">
                  Tipo
                </th>
                {days.map((day) => (
                  <th
                    key={day.toISOString()}
                    className="px-1 py-3 font-medium text-slate-500 text-center min-w-[40px]"
                  >
                    <div className="text-xs">
                      {format(day, "EEE", { locale: es })}
                    </div>
                    <div>{format(day, "d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((rt) => (
                <tr key={rt.id} className="border-b border-slate-50">
                  <td className="sticky left-0 bg-white z-10 px-4 py-2 font-medium text-slate-900">
                    <div>{rt.name}</div>
                    <div className="text-xs text-slate-400 font-normal">
                      {roomCounts[rt.id] ?? 0} hab. &middot; {currency}{" "}
                      {rt.base_price}
                    </div>
                  </td>
                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const count = getAvailableCount(rt.id, dateStr);
                    const colorClass = getCellColor(rt.id, dateStr);
                    return (
                      <td key={dateStr} className="px-1 py-2 text-center">
                        <button
                          onClick={() => openEditor(rt.id, dateStr)}
                          className={cn(
                            "w-full rounded-md px-1 py-1.5 text-xs font-medium transition-colors hover:ring-2 hover:ring-blue-300",
                            colorClass
                          )}
                          title={`${rt.name} - ${dateStr}`}
                        >
                          {count === -1 ? "X" : count}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline editor */}
      {editor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                Editar disponibilidad
              </h3>
              <button
                onClick={() => setEditor(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              {roomTypes.find((rt) => rt.id === editor.roomTypeId)?.name} &mdash;{" "}
              {format(new Date(editor.date + "T12:00:00"), "d MMM yyyy", {
                locale: es,
              })}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Precio override ({currency})
                </label>
                <input
                  type="number"
                  value={editor.priceOverride}
                  onChange={(e) =>
                    setEditor({ ...editor, priceOverride: e.target.value })
                  }
                  placeholder="Dejar vacío para precio base"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estancia mínima (noches)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editor.minStay}
                  onChange={(e) =>
                    setEditor({ ...editor, minStay: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editor.isClosed}
                  onChange={(e) =>
                    setEditor({ ...editor, isClosed: e.target.checked })
                  }
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  Cerrado (no disponible)
                </span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditor(null)}
                className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditor}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200" /> &gt;50% disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-200" /> 1-50% disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200" /> Lleno
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200" /> Cerrado
        </span>
      </div>
    </div>
  );
}
