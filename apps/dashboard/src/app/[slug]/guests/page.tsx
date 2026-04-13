import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@hotelos/shared/utils";
import { Users } from "lucide-react";
import { GuestSearch } from "./guest-search";

export default async function GuestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, currency")
    .eq("slug", slug)
    .single();

  if (!org) return null;

  let query = supabase
    .from("guests")
    .select("*")
    .eq("organization_id", org.id)
    .order("total_stays", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: guests } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Huespedes</h1>
      </div>

      <GuestSearch slug={slug} initialQuery={q || ""} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Telefono
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Estancias
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Total gastado
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ultima visita
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guests && guests.length > 0 ? (
                guests.map((guest: Record<string, unknown>) => (
                  <tr
                    key={guest.id as string}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {guest.full_name as string}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {guest.email as string}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(guest.phone as string) || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {guest.total_stays as number}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(
                        guest.total_spent as number,
                        org.currency
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {guest.updated_at
                        ? new Date(
                            guest.updated_at as string
                          ).toLocaleDateString("es-MX")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    {q
                      ? "No se encontraron huespedes"
                      : "No hay huespedes registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
