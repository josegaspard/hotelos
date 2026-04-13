"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Bed,
  Maximize,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Bath,
  ShowerHead,
  ParkingCircle,
  ConciergeBell,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import { AMENITY_LABELS } from "@hotelos/shared/constants";
import { formatCurrency } from "@hotelos/shared/utils";
import type { RoomType } from "@hotelos/shared/types";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  tv: <Tv className="h-3.5 w-3.5" />,
  coffee_maker: <Coffee className="h-3.5 w-3.5" />,
  bathtub: <Bath className="h-3.5 w-3.5" />,
  shower: <ShowerHead className="h-3.5 w-3.5" />,
  parking: <ParkingCircle className="h-3.5 w-3.5" />,
  room_service: <ConciergeBell className="h-3.5 w-3.5" />,
};

type SortOption = "price_asc" | "price_desc" | "capacity";

export type SearchResult = {
  roomType: RoomType;
  available: number;
  pricePerNight: number;
  totalPrice: number;
};

export function SearchFilters({
  results,
  slug,
  checkin,
  checkout,
  adults,
  children: childrenCount,
  accentColor,
  currency,
}: {
  results: SearchResult[];
  slug: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  accentColor: string;
  currency: string;
}) {
  const [sortBy, setSortBy] = useState<SortOption>("price_asc");
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set()
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Collect all unique amenities across results
  const allAmenities = useMemo(() => {
    const amenitySet = new Set<string>();
    for (const r of results) {
      if (r.roomType.amenities) {
        for (const a of r.roomType.amenities) {
          amenitySet.add(a);
        }
      }
    }
    return Array.from(amenitySet);
  }, [results]);

  // Price range
  const priceRange = useMemo(() => {
    if (results.length === 0) return null;
    const prices = results.map((r) => r.pricePerNight);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [results]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(amenity)) next.delete(amenity);
      else next.add(amenity);
      return next;
    });
  };

  // Filter and sort
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Filter by amenities
    if (selectedAmenities.size > 0) {
      filtered = filtered.filter((r) => {
        const amenities = r.roomType.amenities || [];
        return Array.from(selectedAmenities).every((a) =>
          amenities.includes(a)
        );
      });
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "capacity":
        filtered.sort(
          (a, b) => b.roomType.max_occupancy - a.roomType.max_occupancy
        );
        break;
    }

    return filtered;
  }, [results, selectedAmenities, sortBy]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Filter bar - collapsible on mobile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Mobile toggle header */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-4 sm:hidden cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            Filtros y orden
            {selectedAmenities.size > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {selectedAmenities.size}
              </span>
            )}
          </span>
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Filter content - always visible on desktop, collapsible on mobile */}
        <div className={`p-3 sm:p-4 space-y-3 sm:space-y-4 border-t border-gray-100 sm:border-t-0 ${filtersOpen ? "block" : "hidden sm:block"}`}>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                title="Ordenar resultados"
                aria-label="Ordenar resultados"
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="capacity">Capacidad</option>
              </select>
            </div>

            {/* Price range */}
            {priceRange && (
              <div className="text-sm text-gray-400">
                {formatCurrency(priceRange.min, currency)}
                {priceRange.min !== priceRange.max &&
                  ` — ${formatCurrency(priceRange.max, currency)}`}{" "}
                / noche
              </div>
            )}
          </div>

          {/* Amenity filters */}
          {allAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allAmenities.map((amenity) => {
                const isSelected = selectedAmenities.has(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer min-h-[32px] ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {AMENITY_ICONS[amenity] || null}
                    {AMENITY_LABELS[amenity] || amenity}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
        {filteredResults.length > 0
          ? `${filteredResults.length} ${filteredResults.length === 1 ? "habitacion disponible" : "habitaciones disponibles"}`
          : "No hay habitaciones disponibles"}
      </h1>

      {/* Room cards */}
      <div className="space-y-4">
        {filteredResults.map((result) => {
          const overCapacity =
            adults + childrenCount > result.roomType.max_occupancy;

          return (
            <div
              key={result.roomType.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row">
                {/* Photo */}
                <div className="relative md:w-72 md:min-h-56 bg-gray-100 flex-shrink-0">
                  {result.roomType.photos &&
                  result.roomType.photos.length > 0 ? (
                    <Image
                      src={result.roomType.photos[0]}
                      alt={result.roomType.name}
                      width={400}
                      height={300}
                      className="w-full h-52 sm:h-56 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-52 sm:h-56 md:h-full flex items-center justify-center">
                      <Bed className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {/* Urgency badge overlay */}
                  {result.available <= 2 && result.available > 0 && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-full shadow-md">
                      <Flame className="h-3 w-3" />
                      {result.available === 1
                        ? "Ultima disponible!"
                        : `Solo quedan ${result.available}!`}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {result.roomType.name}
                      </h3>
                      {result.roomType.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.roomType.description}
                        </p>
                      )}
                    </div>

                    {/* Capacity warning */}
                    {overCapacity && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Capacidad maxima: {result.roomType.max_occupancy}{" "}
                        personas
                      </div>
                    )}

                    {/* Details row with bed type prominent */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Max {result.roomType.max_occupancy}{" "}
                        {result.roomType.max_occupancy === 1
                          ? "persona"
                          : "personas"}
                      </span>
                      {result.roomType.size_sqm && (
                        <span className="flex items-center gap-1">
                          <Maximize className="h-3.5 w-3.5" />
                          {result.roomType.size_sqm} m&sup2;
                        </span>
                      )}
                      {result.roomType.bed_type && (
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-600">
                          <Bed className="h-3.5 w-3.5" />
                          {result.roomType.bed_type}
                        </span>
                      )}
                    </div>

                    {/* Amenities */}
                    {result.roomType.amenities &&
                      result.roomType.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.roomType.amenities
                            .slice(0, 6)
                            .map((amenity: string) => (
                              <span
                                key={amenity}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-500"
                              >
                                {AMENITY_ICONS[amenity] || null}
                                {AMENITY_LABELS[amenity] || amenity}
                              </span>
                            ))}
                          {result.roomType.amenities.length > 6 && (
                            <span className="px-2 py-0.5 text-xs text-gray-400">
                              +{result.roomType.amenities.length - 6} mas
                            </span>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-4 pt-4 border-t border-gray-100 gap-3">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {formatCurrency(result.pricePerNight, currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        por noche &middot;{" "}
                        {formatCurrency(result.totalPrice, currency)} total
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {result.available}{" "}
                        {result.available === 1
                          ? "disponible"
                          : "disponibles"}
                      </p>
                    </div>
                    <Link
                      href={`/${slug}/book?room_type_id=${result.roomType.id}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${childrenCount}`}
                      className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-sm shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
