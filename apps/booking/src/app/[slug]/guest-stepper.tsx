"use client";

import { useState } from "react";
import { Users, Baby, Minus, Plus } from "lucide-react";

export function GuestStepper({
  defaultAdults,
  defaultChildren,
}: {
  defaultAdults: number;
  defaultChildren: number;
}) {
  const [adults, setAdults] = useState(defaultAdults);
  const [children, setChildren] = useState(defaultChildren);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          Adultos
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setAdults((v) => Math.max(1, v - 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={adults <= 1}
            aria-label="Menos adultos"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            name="adults"
            value={adults}
            readOnly
            min="1"
            max="10"
            required
            className="flex-1 text-center py-3 text-sm font-semibold text-gray-900 border-x border-gray-200 bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setAdults((v) => Math.min(10, v + 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={adults >= 10}
            aria-label="Mas adultos"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Baby className="h-4 w-4 text-gray-400" />
          Menores
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setChildren((v) => Math.max(0, v - 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={children <= 0}
            aria-label="Menos menores"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            name="children"
            value={children}
            readOnly
            min="0"
            max="6"
            className="flex-1 text-center py-3 text-sm font-semibold text-gray-900 border-x border-gray-200 bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setChildren((v) => Math.min(6, v + 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={children >= 6}
            aria-label="Mas menores"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
