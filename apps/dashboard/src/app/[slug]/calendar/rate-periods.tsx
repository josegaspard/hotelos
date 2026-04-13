"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RatePeriod } from "@hotelos/shared/types";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface RatePeriodsProps {
  organizationId: string;
}

export function RatePeriods({ organizationId }: RatePeriodsProps) {
  const [periods, setPeriods] = useState<RatePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    rate_modifier: "",
    min_stay: "1",
  });

  const supabase = createClient();

  async function fetchPeriods() {
    setLoading(true);
    const { data } = await supabase
      .from("rate_periods")
      .select("*")
      .eq("organization_id", organizationId)
      .order("start_date", { ascending: true });
    setPeriods((data ?? []) as RatePeriod[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchPeriods();
  }, [organizationId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await supabase.from("rate_periods").insert({
      organization_id: organizationId,
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      rate_modifier: parseFloat(form.rate_modifier),
      min_stay: parseInt(form.min_stay) || 1,
    });

    setForm({
      name: "",
      start_date: "",
      end_date: "",
      rate_modifier: "",
      min_stay: "1",
    });
    setShowForm(false);
    setSaving(false);
    fetchPeriods();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este período de tarifa?")) return;
    await supabase.from("rate_periods").delete().eq("id", id);
    fetchPeriods();
  }

  function formatModifier(value: number) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}%`;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">
          Períodos de tarifa (temporadas)
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo período
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="p-4 border-b border-slate-100 bg-slate-50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Temporada alta"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Modificador (%)
              </label>
              <input
                type="number"
                required
                value={form.rate_modifier}
                onChange={(e) =>
                  setForm({ ...form, rate_modifier: e.target.value })
                }
                placeholder="Ej: 20 o -10"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Estancia mínima
              </label>
              <input
                type="number"
                min="1"
                value={form.min_stay}
                onChange={(e) => setForm({ ...form, min_stay: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear período
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : periods.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay períodos de tarifa configurados
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {periods.map((period) => (
            <div
              key={period.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {period.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {period.start_date} &rarr; {period.end_date} &middot;
                    Estancia mín: {period.min_stay} noche
                    {period.min_stay > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    period.rate_modifier >= 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {formatModifier(period.rate_modifier)}
                </span>
                <button
                  onClick={() => handleDelete(period.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
