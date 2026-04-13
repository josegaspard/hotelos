"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
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
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import { NotificationBadge } from "./notification-badge";
import { cn } from "@/lib/utils";

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
  organizationId,
}: {
  slug: string;
  hotelName: string;
  role: string;
  logoUrl: string | null;
  organizationId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  // For mobile bottom nav: show max 4 items + "more" if needed
  const bottomNavItems = filteredNav.slice(0, 4);
  const overflowItems = filteredNav.slice(4);

  function isActive(href: string) {
    const fullHref = `/${slug}${href}`;
    return href === ""
      ? pathname === `/${slug}`
      : pathname.startsWith(fullHref);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">
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
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={fullHref}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
                {item.href === "/bookings" && (
                  <NotificationBadge organizationId={organizationId} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition w-full"
          >
            <LogOut className="w-4.5 h-4.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={hotelName}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <p className="font-semibold text-sm truncate max-w-[200px]">{hotelName}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title={mobileDrawerOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileDrawerOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile slide-out drawer */}
      {mobileDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-slate-900 text-white z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
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
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {filteredNav.map((item) => {
                const fullHref = `/${slug}${item.href}`;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={fullHref}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    {item.label}
                    {item.href === "/bookings" && (
                      <NotificationBadge organizationId={organizationId} />
                    )}
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
          </div>
        </>
      )}

      {/* Mobile bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const fullHref = `/${slug}${item.href}`;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors min-w-[3.5rem]",
                active
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className="truncate text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {overflowItems.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              title="Más opciones"
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors min-w-[3.5rem]",
                overflowItems.some((item) => isActive(item.href))
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">Más</span>
            </button>
            {moreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreMenuOpen(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1">
                  {overflowItems.map((item) => {
                    const fullHref = `/${slug}${item.href}`;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={fullHref}
                        onClick={() => setMoreMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          active
                            ? "text-blue-600 bg-blue-50"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
