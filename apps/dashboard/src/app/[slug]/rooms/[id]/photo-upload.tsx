"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ImagePlus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface PhotoUploadProps {
  roomTypeId: string;
  organizationId: string;
  existingPhotos: string[];
}

export function PhotoUpload({
  roomTypeId,
  organizationId,
  existingPhotos,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function updateDbPhotos(newPhotos: string[]) {
    const { error: dbErr } = await supabase
      .from("room_types")
      .update({ photos: newPhotos, updated_at: new Date().toISOString() })
      .eq("id", roomTypeId);
    if (dbErr) throw new Error(dbErr.message);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 10 - photos.length;
    if (remaining <= 0) {
      setError("Maximo 10 fotos por tipo de habitacion.");
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);

    try {
      const newUrls: string[] = [];

      for (const file of toUpload) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const uuid = crypto.randomUUID();
        const path = `${organizationId}/${roomTypeId}/${uuid}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("photos")
          .upload(path, file, { upsert: false });

        if (uploadErr) throw new Error(`Error subiendo ${file.name}: ${uploadErr.message}`);

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(path);

        newUrls.push(publicUrl);
      }

      const updated = [...photos, ...newUrls];
      await updateDbPhotos(updated);
      setPhotos(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir fotos");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(index: number) {
    setError(null);
    const url = photos[index];

    // Extract path from URL: after /object/public/photos/
    const match = url.match(/\/object\/public\/photos\/(.+)$/);
    if (match) {
      await supabase.storage.from("photos").remove([match[1]]);
    }

    const updated = photos.filter((_, i) => i !== index);
    try {
      await updateDbPhotos(updated);
      setPhotos(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar foto");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const updated = [...photos];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    try {
      await updateDbPhotos(updated);
      setPhotos(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reordenar");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Fotos ({photos.length}/10)
        </h2>
        <button
          type="button"
          disabled={uploading || photos.length >= 10}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          {uploading ? "Subiendo..." : "Agregar fotos"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <ImagePlus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">
            No hay fotos. Agrega hasta 10 fotos para este tipo de habitacion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((url, index) => (
            <div
              key={url}
              className="relative group rounded-xl overflow-hidden border border-slate-200"
            >
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-[150px] object-cover"
              />
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors disabled:opacity-30"
                  title="Mover arriba"
                >
                  <ChevronUp className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === photos.length - 1}
                  className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors disabled:opacity-30"
                  title="Mover abajo"
                >
                  <ChevronDown className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
