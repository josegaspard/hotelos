"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@hotelos/shared/types";
import { ROOM_STATUS_LABELS } from "@hotelos/shared/constants";
import { Plus, Trash2, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  occupied: "bg-blue-100 text-blue-800",
  cleaning: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-800",
};

const housekeepingLabels: Record<string, string> = {
  clean: "Limpia",
  dirty: "Sucia",
  in_progress: "Limpiando",
  inspected: "Inspeccionada",
};

const housekeepingColors: Record<string, string> = {
  clean: "bg-green-100 text-green-800",
  dirty: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  inspected: "bg-blue-100 text-blue-800",
};

export function RoomsList({
  rooms: initialRooms,
  roomTypeId,
  organizationId,
  slug,
}: {
  rooms: Room[];
  roomTypeId: string;
  organizationId: string;
  slug: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_number: "", floor: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoom.room_number.trim()) return;

    setAdding(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("rooms")
      .insert({
        organization_id: organizationId,
        room_type_id: roomTypeId,
        room_number: newRoom.room_number.trim(),
        floor: newRoom.floor.trim() || null,
        status: "available",
        housekeeping_status: "clean",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }

    setRooms((prev) => [...prev, data as Room]);
    setNewRoom({ room_number: "", floor: "" });
    setShowAddForm(false);
    setAdding(false);
    router.refresh();
  }

  async function handleStatusChange(roomId: string, status: string) {
    const { error } = await supabase
      .from("rooms")
      .update({ status })
      .eq("id", roomId);

    if (!error) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: status as Room["status"] } : r))
      );
    }
  }

  async function handleHousekeepingChange(roomId: string, status: string) {
    const { error } = await supabase
      .from("rooms")
      .update({ housekeeping_status: status })
      .eq("id", roomId);

    if (!error) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, housekeeping_status: status as Room["housekeeping_status"] }
            : r
        )
      );
    }
  }

  async function handleToggleActive(roomId: string, isActive: boolean) {
    const { error } = await supabase
      .from("rooms")
      .update({ is_active: !isActive })
      .eq("id", roomId);

    if (!error) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId ? { ...r, is_active: !isActive } : r
        )
      );
    }
  }

  async function handleDelete(roomId: string) {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);

    if (!error) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      setDeleteConfirmId(null);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 text-lg">Habitaciones</h2>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar habitacion
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {rooms.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`px-5 py-4 flex items-center justify-between gap-4 ${
                  !room.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {room.room_number}
                    </p>
                    {room.floor && (
                      <p className="text-xs text-slate-400">
                        Piso {room.floor}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <select
                    value={room.status}
                    onChange={(e) =>
                      handleStatusChange(room.id, e.target.value)
                    }
                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${
                      statusColors[room.status] ?? "bg-slate-100"
                    }`}
                  >
                    {Object.entries(ROOM_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={room.housekeeping_status}
                    onChange={(e) =>
                      handleHousekeepingChange(room.id, e.target.value)
                    }
                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${
                      housekeepingColors[room.housekeeping_status] ??
                      "bg-slate-100"
                    }`}
                  >
                    {Object.entries(housekeepingLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(room.id, room.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      room.is_active
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {room.is_active ? "Activa" : "Inactiva"}
                  </button>

                  {deleteConfirmId === room.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id)}
                        className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs text-slate-500 hover:text-slate-700 px-1.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(room.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay habitaciones asignadas a este tipo
          </div>
        )}

        {showAddForm && (
          <form
            onSubmit={handleAddRoom}
            className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Numero de habitacion *
              </label>
              <input
                type="text"
                value={newRoom.room_number}
                onChange={(e) =>
                  setNewRoom((prev) => ({
                    ...prev,
                    room_number: e.target.value,
                  }))
                }
                placeholder="Ej: 101"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Piso
              </label>
              <input
                type="text"
                value={newRoom.floor}
                onChange={(e) =>
                  setNewRoom((prev) => ({ ...prev, floor: e.target.value }))
                }
                placeholder="Ej: 1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewRoom({ room_number: "", floor: "" });
              }}
              className="text-sm text-slate-500 hover:text-slate-700 px-2 py-2"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
