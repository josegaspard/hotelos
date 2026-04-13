"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  BedDouble,
  Receipt,
  CreditCard,
  Code2,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Upload,
  Copy,
  ExternalLink,
} from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  star_rating?: number;
  logo_url?: string;
  checkin_time?: string;
  checkout_time?: string;
  tax_percentage?: number;
  tourism_tax?: number;
  cancellation_policy?: string;
  currency?: string;
  stripe_account_id?: string;
  status: string;
  [key: string]: unknown;
}

interface RoomType {
  id?: string;
  name: string;
  base_price: number;
  base_occupancy: number;
  max_occupancy: number;
  bed_type: string;
  amenities: string[];
  rooms: Room[];
}

interface Room {
  id?: string;
  room_number: string;
  floor: number;
}

const STEPS = [
  { label: "Tu hotel", icon: Building2 },
  { label: "Habitaciones", icon: BedDouble },
  { label: "Precios y políticas", icon: Receipt },
  { label: "Pagos", icon: CreditCard },
  { label: "Tu widget", icon: Code2 },
];

const AMENITIES_OPTIONS = [
  "WiFi",
  "TV",
  "Aire acondicionado",
  "Minibar",
  "Caja fuerte",
  "Balcón",
  "Vista al mar",
  "Baño privado",
  "Escritorio",
  "Secador de pelo",
];

const BED_TYPES = [
  { value: "single", label: "Individual" },
  { value: "double", label: "Doble" },
  { value: "queen", label: "Queen" },
  { value: "king", label: "King" },
  { value: "twin", label: "Twin (2 camas)" },
];

const CURRENCIES = [
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "USD", label: "USD - Dólar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "COP", label: "COP - Peso Colombiano" },
  { value: "ARS", label: "ARS - Peso Argentino" },
  { value: "CLP", label: "CLP - Peso Chileno" },
  { value: "PEN", label: "PEN - Sol Peruano" },
];

export function OnboardingWizard({ org, slug }: { org: Org; slug: string }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1 state
  const [hotelData, setHotelData] = useState({
    name: org.name || "",
    description: org.description || "",
    phone: org.phone || "",
    address: org.address || "",
    city: org.city || "",
    country: org.country || "",
    star_rating: org.star_rating || 3,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo_url || null);

  // Step 2 state
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    {
      name: "",
      base_price: 0,
      base_occupancy: 2,
      max_occupancy: 4,
      bed_type: "double",
      amenities: [],
      rooms: [{ room_number: "", floor: 1 }],
    },
  ]);

  // Step 3 state
  const [policies, setPolicies] = useState({
    checkin_time: org.checkin_time || "15:00",
    checkout_time: org.checkout_time || "11:00",
    tax_percentage: org.tax_percentage ?? 16,
    tourism_tax: org.tourism_tax ?? 0,
    cancellation_policy: org.cancellation_policy || "moderate",
    currency: org.currency || "MXN",
  });

  // Step 4 state
  const [stripeConnected, setStripeConnected] = useState(!!org.stripe_account_id);

  // Step 5
  const [copied, setCopied] = useState(false);

  const widgetUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/widget/${slug}`;
  const embedCode = `<iframe src="${widgetUrl}" width="100%" height="600" frameborder="0" style="border-radius:12px;"></iframe>`;

  const updateHotelField = (field: string, value: unknown) => {
    setHotelData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const saveStep1 = async () => {
    setSaving(true);
    let logo_url = org.logo_url;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${org.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }
    }

    await supabase
      .from("organizations")
      .update({ ...hotelData, logo_url })
      .eq("id", org.id);

    setSaving(false);
  };

  const saveStep2 = async () => {
    setSaving(true);

    for (const rt of roomTypes) {
      if (!rt.name || rt.rooms.length === 0) continue;

      if (rt.id) {
        // Already saved, update
        await supabase
          .from("room_types")
          .update({
            name: rt.name,
            base_price: rt.base_price,
            base_occupancy: rt.base_occupancy,
            max_occupancy: rt.max_occupancy,
            bed_type: rt.bed_type,
            amenities: rt.amenities,
          })
          .eq("id", rt.id);
      } else {
        // Create new
        const { data: newType } = await supabase
          .from("room_types")
          .insert({
            organization_id: org.id,
            name: rt.name,
            base_price: rt.base_price,
            base_occupancy: rt.base_occupancy,
            max_occupancy: rt.max_occupancy,
            bed_type: rt.bed_type,
            amenities: rt.amenities,
          })
          .select("id")
          .single();

        if (newType) {
          rt.id = newType.id;

          // Create rooms for this type
          const roomsToInsert = rt.rooms
            .filter((r) => r.room_number && !r.id)
            .map((r) => ({
              organization_id: org.id,
              room_type_id: newType.id,
              room_number: r.room_number,
              floor: r.floor,
              status: "available",
            }));

          if (roomsToInsert.length > 0) {
            const { data: newRooms } = await supabase
              .from("rooms")
              .insert(roomsToInsert)
              .select("id, room_number");

            if (newRooms) {
              newRooms.forEach((nr, i) => {
                const matchRoom = rt.rooms.find((r) => r.room_number === nr.room_number && !r.id);
                if (matchRoom) matchRoom.id = nr.id;
              });
            }
          }
        }
      }
    }

    setSaving(false);
  };

  const saveStep3 = async () => {
    setSaving(true);
    await supabase
      .from("organizations")
      .update({
        checkin_time: policies.checkin_time,
        checkout_time: policies.checkout_time,
        tax_percentage: policies.tax_percentage,
        tourism_tax: policies.tourism_tax,
        cancellation_policy: policies.cancellation_policy,
        currency: policies.currency,
      })
      .eq("id", org.id);
    setSaving(false);
  };

  const handleNext = async () => {
    if (step === 0) await saveStep1();
    if (step === 1) await saveStep2();
    if (step === 2) await saveStep3();
    // Step 3 (payments) doesn't require save
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFinish = async () => {
    setSaving(true);
    await supabase
      .from("organizations")
      .update({ status: "active" })
      .eq("id", org.id);

    try {
      await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hotel_welcome",
          to: org.email || hotelData.name,
          data: { hotel_name: hotelData.name, slug },
        }),
      });
    } catch {
      // Non-blocking
    }

    setSaving(false);
    router.push(`/${slug}`);
    router.refresh();
  };

  const connectStripe = async () => {
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: org.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Handle error
    }
  };

  const addRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      {
        name: "",
        base_price: 0,
        base_occupancy: 2,
        max_occupancy: 4,
        bed_type: "double",
        amenities: [],
        rooms: [{ room_number: "", floor: 1 }],
      },
    ]);
  };

  const removeRoomType = (index: number) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRoomType = (index: number, field: string, value: unknown) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
      return updated;
    });
  };

  const toggleAmenity = (rtIndex: number, amenity: string) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      const current = updated[rtIndex].amenities;
      updated[rtIndex].amenities = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];
      return updated;
    });
  };

  const addRoom = (rtIndex: number) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      updated[rtIndex].rooms.push({ room_number: "", floor: 1 });
      return updated;
    });
  };

  const removeRoom = (rtIndex: number, roomIndex: number) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      updated[rtIndex].rooms = updated[rtIndex].rooms.filter((_, i) => i !== roomIndex);
      return updated;
    });
  };

  const updateRoom = (rtIndex: number, roomIndex: number, field: string, value: unknown) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      (updated[rtIndex].rooms[roomIndex] as unknown as Record<string, unknown>)[field] = value;
      return updated;
    });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Configura tu hotel
        </h1>
        <p className="text-slate-500 mt-1">
          Completa estos pasos para comenzar a recibir reservas
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
                i === step
                  ? "bg-blue-600 text-white"
                  : i < step
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {i < step ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  i < step ? "bg-blue-400" : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Datos del hotel
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Logo del hotel</p>
                <p className="text-xs text-slate-400">PNG o JPG, max 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nombre del hotel</label>
                <input
                  type="text"
                  value={hotelData.name}
                  onChange={(e) => updateHotelField("name", e.target.value)}
                  className={inputClass}
                  placeholder="Hotel Playa Azul"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descripción</label>
                <textarea
                  value={hotelData.description}
                  onChange={(e) => updateHotelField("description", e.target.value)}
                  className={cn(inputClass, "h-24 resize-none")}
                  placeholder="Describe tu hotel..."
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="tel"
                  value={hotelData.phone}
                  onChange={(e) => updateHotelField("phone", e.target.value)}
                  className={inputClass}
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div>
                <label className={labelClass}>Estrellas</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateHotelField("star_rating", n)}
                      className={cn(
                        "w-10 h-10 rounded-lg text-lg transition",
                        n <= hotelData.star_rating
                          ? "bg-amber-100 text-amber-500"
                          : "bg-slate-100 text-slate-300"
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Dirección</label>
                <input
                  type="text"
                  value={hotelData.address}
                  onChange={(e) => updateHotelField("address", e.target.value)}
                  className={inputClass}
                  placeholder="Av. Principal #123"
                />
              </div>
              <div>
                <label className={labelClass}>Ciudad</label>
                <input
                  type="text"
                  value={hotelData.city}
                  onChange={(e) => updateHotelField("city", e.target.value)}
                  className={inputClass}
                  placeholder="Cancún"
                />
              </div>
              <div>
                <label className={labelClass}>País</label>
                <input
                  type="text"
                  value={hotelData.country}
                  onChange={(e) => updateHotelField("country", e.target.value)}
                  className={inputClass}
                  placeholder="México"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Tipos de habitación
            </h2>

            {roomTypes.map((rt, rtIndex) => (
              <div
                key={rtIndex}
                className="border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-800">
                    Tipo {rtIndex + 1}
                    {rt.id && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Guardado
                      </span>
                    )}
                  </h3>
                  {roomTypes.length > 1 && (
                    <button
                      onClick={() => removeRoomType(rtIndex)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre del tipo</label>
                    <input
                      type="text"
                      value={rt.name}
                      onChange={(e) =>
                        updateRoomType(rtIndex, "name", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Suite Deluxe"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Precio base / noche</label>
                    <input
                      type="number"
                      value={rt.base_price || ""}
                      onChange={(e) =>
                        updateRoomType(rtIndex, "base_price", Number(e.target.value))
                      }
                      className={inputClass}
                      placeholder="1500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ocupación base</label>
                    <input
                      type="number"
                      value={rt.base_occupancy}
                      onChange={(e) =>
                        updateRoomType(rtIndex, "base_occupancy", Number(e.target.value))
                      }
                      className={inputClass}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ocupación máxima</label>
                    <input
                      type="number"
                      value={rt.max_occupancy}
                      onChange={(e) =>
                        updateRoomType(rtIndex, "max_occupancy", Number(e.target.value))
                      }
                      className={inputClass}
                      min={1}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Tipo de cama</label>
                    <select
                      value={rt.bed_type}
                      onChange={(e) =>
                        updateRoomType(rtIndex, "bed_type", e.target.value)
                      }
                      className={inputClass}
                    >
                      {BED_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Amenidades</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_OPTIONS.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(rtIndex, amenity)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition",
                          rt.amenities.includes(amenity)
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rooms */}
                <div>
                  <label className={labelClass}>Habitaciones</label>
                  <div className="space-y-2">
                    {rt.rooms.map((room, roomIndex) => (
                      <div key={roomIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={room.room_number}
                          onChange={(e) =>
                            updateRoom(rtIndex, roomIndex, "room_number", e.target.value)
                          }
                          className={cn(inputClass, "flex-1")}
                          placeholder="Número (ej: 101)"
                        />
                        <input
                          type="number"
                          value={room.floor}
                          onChange={(e) =>
                            updateRoom(rtIndex, roomIndex, "floor", Number(e.target.value))
                          }
                          className={cn(inputClass, "w-24")}
                          placeholder="Piso"
                          min={0}
                        />
                        {rt.rooms.length > 1 && (
                          <button
                            onClick={() => removeRoom(rtIndex, roomIndex)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addRoom(rtIndex)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar habitación
                  </button>
                </div>
              </div>
            ))}

            {/* Summary */}
            {roomTypes.some((rt) => rt.name) && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Resumen</p>
                {roomTypes
                  .filter((rt) => rt.name)
                  .map((rt, i) => (
                    <p key={i} className="text-sm text-slate-500">
                      {rt.name}: {rt.rooms.filter((r) => r.room_number).length}{" "}
                      habitacion(es) - ${rt.base_price}/noche
                    </p>
                  ))}
              </div>
            )}

            <button
              type="button"
              onClick={addRoomType}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar otro tipo
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Precios y políticas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Hora de check-in</label>
                <input
                  type="time"
                  value={policies.checkin_time}
                  onChange={(e) =>
                    setPolicies((p) => ({ ...p, checkin_time: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Hora de check-out</label>
                <input
                  type="time"
                  value={policies.checkout_time}
                  onChange={(e) =>
                    setPolicies((p) => ({ ...p, checkout_time: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Impuesto (%)</label>
                <input
                  type="number"
                  value={policies.tax_percentage}
                  onChange={(e) =>
                    setPolicies((p) => ({
                      ...p,
                      tax_percentage: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
              <div>
                <label className={labelClass}>Impuesto turístico</label>
                <input
                  type="number"
                  value={policies.tourism_tax}
                  onChange={(e) =>
                    setPolicies((p) => ({
                      ...p,
                      tourism_tax: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <label className={labelClass}>Política de cancelación</label>
                <select
                  value={policies.cancellation_policy}
                  onChange={(e) =>
                    setPolicies((p) => ({
                      ...p,
                      cancellation_policy: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="flexible">
                    Flexible - Cancelación gratuita 24h antes
                  </option>
                  <option value="moderate">
                    Moderada - Cancelación gratuita 48h antes
                  </option>
                  <option value="strict">
                    Estricta - Sin reembolso
                  </option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select
                  value={policies.currency}
                  onChange={(e) =>
                    setPolicies((p) => ({ ...p, currency: e.target.value }))
                  }
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Conecta tus pagos
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Conecta tu cuenta de Stripe para recibir pagos de las reservas
              directamente en tu cuenta bancaria.
            </p>

            {stripeConnected ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-700 font-medium">
                  Stripe conectado correctamente
                </p>
              </div>
            ) : (
              <div className="py-6 space-y-4">
                <button
                  onClick={connectStripe}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#635BFF] text-white rounded-lg font-medium hover:bg-[#5851DB] transition"
                >
                  <CreditCard className="w-5 h-5" />
                  Conectar con Stripe
                </button>
                <p className="text-sm text-slate-400">
                  <button
                    onClick={() => setStep(4)}
                    className="text-blue-600 hover:underline"
                  >
                    Omitir por ahora
                  </button>{" "}
                  — puedes conectar después en Configuración
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 text-center">
              Tu widget de reservas
            </h2>
            <p className="text-slate-500 text-sm text-center max-w-md mx-auto">
              Copia este código y pégalo en tu sitio web para que tus huéspedes
              puedan reservar directamente.
            </p>

            <div className="bg-slate-900 rounded-xl p-4 relative">
              <pre className="text-green-400 text-xs overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-3 right-3 p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-300" />
                )}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-slate-400 ml-2">
                  Vista previa del widget
                </span>
              </div>
              <div className="bg-white p-4">
                <iframe
                  src={widgetUrl}
                  width="100%"
                  height="400"
                  className="rounded-lg border border-slate-100"
                  style={{ pointerEvents: "none" }}
                />
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 text-lg"
              >
                {saving ? "Activando..." : "¡Todo listo!"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition",
              step === 0
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Siguiente"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
