"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statusColors: Record<string, string> = {
  dirty: "border-red-300 bg-red-50",
  in_progress: "border-yellow-300 bg-yellow-50",
  clean: "border-green-300 bg-green-50",
  inspected: "border-blue-300 bg-blue-50",
};

const statusBadgeColors: Record<string, string> = {
  dirty: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  clean: "bg-green-100 text-green-700",
  inspected: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  dirty: "Sucia",
  in_progress: "En progreso",
  clean: "Limpia",
  inspected: "Inspeccionada",
};

const roomStatusLabels: Record<string, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  cleaning: "Limpieza",
  maintenance: "Mant.",
  blocked: "Bloqueada",
};

interface HousekeepingCardProps {
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  status: string;
  housekeepingStatus: string;
}

export function HousekeepingCard({
  roomId,
  roomNumber,
  roomTypeName,
  status,
  housekeepingStatus: initialHkStatus,
}: HousekeepingCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [hkStatus, setHkStatus] = useState(initialHkStatus);
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    setHkStatus(newStatus);

    await supabase
      .from("rooms")
      .update({ housekeeping_status: newStatus })
      .eq("id", roomId);

    setUpdating(false);
    router.refresh();
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-colors ${
        statusColors[hkStatus] ?? "border-slate-200 bg-white"
      } ${updating ? "opacity-60" : ""}`}
    >
      <p className="text-xl font-bold text-slate-900">{roomNumber}</p>
      <p className="text-xs text-slate-500 mb-2 truncate">{roomTypeName}</p>

      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
          statusBadgeColors[hkStatus] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        {statusLabels[hkStatus] ?? hkStatus}
      </span>

      <p className="text-xs text-slate-400 mb-3">
        {roomStatusLabels[status] ?? status}
      </p>

      <select
        value={hkStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={updating}
        className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 bg-white disabled:opacity-50"
      >
        <option value="dirty">Sucia</option>
        <option value="in_progress">En progreso</option>
        <option value="clean">Limpia</option>
        <option value="inspected">Inspeccionada</option>
      </select>
    </div>
  );
}
