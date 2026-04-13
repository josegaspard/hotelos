"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationBadge({
  organizationId,
}: {
  organizationId: string;
}) {
  const [newCount, setNewCount] = useState(0);
  const [lastToast, setLastToast] = useState<string | null>(null);
  const pathname = usePathname();

  // Clear badge when visiting bookings page
  useEffect(() => {
    if (pathname.includes("/bookings")) {
      setNewCount(0);
    }
  }, [pathname]);

  const dismissToast = useCallback(() => {
    setLastToast(null);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`bookings-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const booking = payload.new as {
            guest_name?: string;
            room_type_id?: string;
          };

          // Only increment if not on bookings page
          if (!window.location.pathname.includes("/bookings")) {
            setNewCount((prev) => prev + 1);
          }

          // Show toast
          const message = booking.guest_name
            ? `Nueva reserva: ${booking.guest_name}`
            : "Nueva reserva recibida";
          setLastToast(message);

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setLastToast(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return (
    <>
      {/* Badge */}
      {newCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
          {newCount > 9 ? "9+" : newCount}
        </span>
      )}

      {/* Toast */}
      {lastToast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-border shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 max-w-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
          <p className="text-sm text-gray-900 flex-1">{lastToast}</p>
          <button
            onClick={dismissToast}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
