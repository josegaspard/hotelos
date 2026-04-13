"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { roomTypeSchema } from "@hotelos/shared/validators";
import {
  BED_TYPES,
  AMENITIES,
  AMENITY_LABELS,
} from "@hotelos/shared/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewRoomTypePage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    base_occupancy: 2,
    max_occupancy: 4,
    max_children: 2,
    base_price: 0,
    extra_person_charge: 0,
    size_sqm: "",
    bed_type: "",
    amenities: [] as string[],
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      });

      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!org) {
        setError("Organización no encontrada");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("room_types")
        .insert({
          organization_id: org.id,
          ...parsed,
          photos: [],
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push(`/${slug}/rooms`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error inesperado");
      }
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/rooms`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a habitaciones
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Nuevo tipo de habitación
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
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
              placeholder="Ej: Suite Presidencial"
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
              placeholder="Describe este tipo de habitación..."
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

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link
            href={`/${slug}/rooms`}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear tipo de habitación
          </button>
        </div>
      </form>
    </div>
  );
}
