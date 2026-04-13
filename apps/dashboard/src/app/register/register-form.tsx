"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { slugify } from "@hotelos/shared/utils";

export function RegisterForm() {
  const [hotelName, setHotelName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: hotelName, hotel_name: hotelName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Error al crear cuenta");
      setLoading(false);
      return;
    }

    const slug = slugify(hotelName);

    const { error: orgError } = await supabase.from("organizations").insert({
      name: hotelName,
      slug,
      email,
    });

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (org) {
      await supabase.from("organization_members").insert({
        organization_id: org.id,
        user_id: authData.user.id,
        role: "owner",
      });
    }

    router.push(`/${slug}/onboarding`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleRegister}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre del hotel
        </label>
        <input
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Hotel Playa Azul"
        />
        {hotelName && (
          <p className="text-xs text-slate-400 mt-1">
            URL: app.hotelos.com/{slugify(hotelName)}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="correo@hotel.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Creando hotel..." : "Crear hotel"}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Iniciar sesión
        </a>
      </p>
    </form>
  );
}
