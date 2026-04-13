"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@hotelos/shared/types";
import { CURRENCIES } from "@hotelos/shared/constants";
import { Save, Upload, Loader2, Code, Copy, Check } from "lucide-react";

interface SettingsFormProps {
  organization: Organization;
}

const TIMEZONES = [
  "America/Mexico_City",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Bogota",
  "America/Buenos_Aires",
  "America/Lima",
  "America/Santiago",
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
];

const STAR_RATINGS = [
  { value: "", label: "Sin clasificar" },
  { value: "1", label: "1 estrella" },
  { value: "2", label: "2 estrellas" },
  { value: "3", label: "3 estrellas" },
  { value: "4", label: "4 estrellas" },
  { value: "5", label: "5 estrellas" },
];

export function SettingsForm({ organization }: SettingsFormProps) {
  const [form, setForm] = useState({
    name: organization.name,
    email: organization.email,
    phone: organization.phone ?? "",
    address: organization.address ?? "",
    city: organization.city ?? "",
    country: organization.country ?? "",
    timezone: organization.timezone,
    currency: organization.currency,
    star_rating: organization.star_rating?.toString() ?? "",
    description: organization.description ?? "",
    checkin_time: organization.checkin_time,
    checkout_time: organization.checkout_time,
    tax_percentage: organization.tax_percentage.toString(),
    tourism_tax: organization.tourism_tax.toString(),
    primary_color: organization.primary_color,
    secondary_color: organization.secondary_color,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(organization.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    let logo_url = organization.logo_url;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${organization.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("logos").getPublicUrl(path);
        logo_url = publicUrl;
      }
    }

    await supabase
      .from("organizations")
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        country: form.country || null,
        timezone: form.timezone,
        currency: form.currency,
        star_rating: form.star_rating ? parseInt(form.star_rating) : null,
        description: form.description || null,
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        tax_percentage: parseFloat(form.tax_percentage),
        tourism_tax: parseFloat(form.tourism_tax),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organization.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const widgetCode = `<div id="hotelos-widget" data-hotel="${organization.slug}"></div>\n<script src="https://hotelos.vercel.app/widget.js" async></script>`;

  function copyWidget() {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informacion general */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Informaci&oacute;n general
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del hotel
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tel&eacute;fono
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Clasificaci&oacute;n
            </label>
            <select
              name="star_rating"
              value={form.star_rating}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STAR_RATINGS.map((sr) => (
                <option key={sr.value} value={sr.value}>
                  {sr.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripci&oacute;n
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
              )}
              <label className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicacion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Ubicaci&oacute;n
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Direcci&oacute;n
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pa&iacute;s
            </label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Zona horaria
            </label>
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Moneda
            </label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Politicas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Pol&iacute;ticas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hora de check-in
            </label>
            <input
              type="time"
              name="checkin_time"
              value={form.checkin_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hora de check-out
            </label>
            <input
              type="time"
              name="checkout_time"
              value={form.checkout_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              IVA / Impuesto (%)
            </label>
            <input
              type="number"
              name="tax_percentage"
              step="0.01"
              value={form.tax_percentage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Impuesto tur&iacute;stico (por noche)
            </label>
            <input
              type="number"
              name="tourism_tax"
              step="0.01"
              value={form.tourism_tax}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Personalizacion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Personalizaci&oacute;n
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Color primario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="primary_color"
                value={form.primary_color}
                onChange={handleChange}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) =>
                  setForm({ ...form, primary_color: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Color secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="secondary_color"
                value={form.secondary_color}
                onChange={handleChange}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.secondary_color}
                onChange={(e) =>
                  setForm({ ...form, secondary_color: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>

      {/* Widget embed code */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            C&oacute;digo del widget de reservas
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Copia y pega este c&oacute;digo en tu sitio web para mostrar el motor
          de reservas.
        </p>
        <div className="relative">
          <pre className="bg-slate-900 text-green-400 text-sm p-4 rounded-lg overflow-x-auto">
            {widgetCode}
          </pre>
          <button
            type="button"
            onClick={copyWidget}
            className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Copiar"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
