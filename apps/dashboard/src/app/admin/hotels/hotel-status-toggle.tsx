"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function HotelStatusToggle({
  hotelId,
  currentStatus,
}: {
  hotelId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await supabase
      .from("organizations")
      .update({ status: newStatus })
      .eq("id", hotelId);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`text-xs font-medium px-2 py-1 rounded transition ${
        currentStatus === "active"
          ? "text-red-600 hover:bg-red-50"
          : "text-green-600 hover:bg-green-50"
      }`}
    >
      {loading
        ? "..."
        : currentStatus === "active"
        ? "Suspender"
        : "Activar"}
    </button>
  );
}
