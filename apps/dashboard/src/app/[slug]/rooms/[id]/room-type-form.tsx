"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { roomTypeSchema } from "@hotelos/shared/validators";
import {
  BED_TYPES,
  AMENITIES,
  AMENITY_LABELS,
} from "@hotelos/shared/constants";
import type { RoomType } from "@hotelos/shared/types";
import { Loader2, Trash2, Check } from "lucide-react";

export function RoomTypeForm({
  roomType,
  slug,
  currency,
}: {
  roomType: RoomType;
  slug: string;
  currency: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: roomType.name,
    description: roomType.description ?? "",
    base_occupancy: roomType.base_occupancy,
    max_occupancy: roomType.max_occupancy,
    max_children: roomType.max_children,
    base_price: roomType.base_price,
    extra_person_charge: roomType.extra_person_charge,
    size_sqm: roomType.size_sqm?.toString() ?? "",
    bed_type: roomType.bed_type ?? "",
    amenities: roomType.amenities ?? [],
    is_active: roomType.is_active,
  });

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const parsed = roomTypeSchema.parse({
        name: form.name,
        description: form.description || null,
        base_occupancy: form.base_occupancy,
        max_occupancy: form.max_occupancy,
        max_children: form.max_children,
        base_price: form.base_price,
        extra_person_charge: form.extra_person_charge,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        bed_type: form.bed_type || null,
        amenities: form.amenities,
        is_active: form.is_active,
      });

      const { error } = await supabase
        .from("room_types")
        .update(parsed)
        .eq("id", roomType.id);

      if (error) {
        setFeedback({ type: "error", message: error.message });
      } else {
        setFeedback({ type: "success", message: "Guardado correctamente" });
        router.refresh();
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    const { error } = await supabase
      .from("room_types")
      .delete()
      .eq("id", roomType.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      setDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    router.push(`/${slug}/rooms`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave}>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Datos del tipo</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-700">Activo</span>
          </label>
        </div>

        {feedback && (
          <div
            className={`text-sm rounded-lg px-4 py-3 ${
              feedback.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nombre *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ocupación base
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.base_occupancy}
              onChange={(e) =>
                updateField("base_occupancy", Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ocupación máxima
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.max_occupancy}
              onChange={(e) =>
                updateField("max_occupancy", Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Máx. niños
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={form.max_children}
              onChange={(e) =>
                updateField("max_children", Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Precio base por noche *
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.base_price}
              onChange={(e) =>
                updateField("base_price", Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Cargo persona extra
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.extra_person_charge}
              onChange={(e) =>
                updateField("extra_person_charge", Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tamaño (m²)
            </label>
            <input
              type="number"
              min={0}
              value={form.size_sqm}
              onChange={(e) => updateField("size_sqm", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tipo de cama
          </label>
          <select
            value={form.bed_type}
            onChange={(e) => updateField("bed_type", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {BED_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>
                {bt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Amenidades
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AMENITIES.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {AMENITY_LABELS[amenity] ?? amenity}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600">
                Esto eliminara el tipo y sus habitaciones
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar tipo
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
