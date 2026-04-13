"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function HotelDetailActions({
  hotelId,
  slug,
  currentStatus,
  currentCommissionRate,
}: {
  hotelId: string;
  slug: string;
  currentStatus: string;
  currentCommissionRate: number;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [commissionRate, setCommissionRate] = useState(currentCommissionRate);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSaveCommission = async () => {
    setSaving(true);
    await supabase
      .from("organizations")
      .update({ commission_rate: commissionRate })
      .eq("id", hotelId);
    setSaving(false);
    router.refresh();
  };

  const handleChangeStatus = async (newStatus: string) => {
    setSaving(true);
    await supabase
      .from("organizations")
      .update({ status: newStatus })
      .eq("id", hotelId);
    setStatus(newStatus);
    setSaving(false);
    router.refresh();
  };

  const handleImpersonate = () => {
    document.cookie = `admin_impersonate=${slug}; path=/; max-age=3600`;
    router.push(`/${slug}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <h2 className="font-semibold text-slate-900">Acciones de admin</h2>

      {/* Commission rate */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Tasa de comisión (%)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            min={0}
            max={100}
            step={0.5}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
          />
          <button
            onClick={handleSaveCommission}
            disabled={saving}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Status change */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Cambiar estado
        </label>
        <div className="flex flex-wrap gap-2">
          {["active", "suspended", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => handleChangeStatus(s)}
              disabled={saving || status === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                status === s
                  ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300"
                  : s === "active"
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : s === "suspended"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {s === "active"
                ? "Activo"
                : s === "suspended"
                ? "Suspendido"
                : "Cancelado"}
            </button>
          ))}
        </div>
      </div>

      {/* Impersonate */}
      <div>
        <button
          onClick={handleImpersonate}
          className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          Impersonar hotel
        </button>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Accede al panel del hotel como si fueras el dueño
        </p>
      </div>
    </div>
  );
}
