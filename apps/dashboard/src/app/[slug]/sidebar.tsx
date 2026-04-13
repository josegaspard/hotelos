"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  ClipboardList,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "receptionist"] },
  { href: "/rooms", label: "Habitaciones", icon: BedDouble, roles: ["owner", "manager", "receptionist"] },
  { href: "/calendar", label: "Calendario", icon: CalendarDays, roles: ["owner", "manager", "receptionist"] },
  { href: "/bookings", label: "Reservas", icon: ClipboardList, roles: ["owner", "manager", "receptionist"] },
  { href: "/housekeeping", label: "Housekeeping", icon: Sparkles, roles: ["owner", "manager", "receptionist", "housekeeper"] },
  { href: "/guests", label: "Huéspedes", icon: Users, roles: ["owner", "manager", "receptionist"] },
  { href: "/finances", label: "Finanzas", icon: DollarSign, roles: ["owner", "manager"] },
  { href: "/settings", label: "Configuración", icon: Settings, roles: ["owner"] },
];

export function Sidebar({
  slug,
  hotelName,
  role,
  logoUrl,
}: {
  slug: string;
  hotelName: string;
  role: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={hotelName}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{hotelName}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {filteredNav.map((item) => {
          const fullHref = `/${slug}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === `/${slug}`
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition w-full"
        >
          <LogOut className="w-4.5 h-4.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
