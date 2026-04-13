import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().length(2).optional().nullable(),
  timezone: z.string().default("America/Mexico_City"),
  currency: z.string().length(3).default("MXN"),
  star_rating: z.number().min(1).max(5).optional().nullable(),
  description: z.string().optional().nullable(),
  checkin_time: z.string().default("15:00"),
  checkout_time: z.string().default("11:00"),
  tax_percentage: z.number().min(0).max(100).default(16),
  tourism_tax: z.number().min(0).default(0),
  primary_color: z.string().default("#1a1a1a"),
  secondary_color: z.string().default("#ffffff"),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  description: z.string().optional().nullable(),
  base_occupancy: z.number().min(1).max(20).default(2),
  max_occupancy: z.number().min(1).max(20).default(4),
  max_children: z.number().min(0).max(10).default(2),
  base_price: z.number().min(0, "Precio inválido"),
  extra_person_charge: z.number().min(0).default(0),
  size_sqm: z.number().min(0).optional().nullable(),
  bed_type: z.string().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

export const roomSchema = z.object({
  room_type_id: z.string().uuid(),
  room_number: z.string().min(1, "Número requerido").max(20),
  floor: z.string().optional().nullable(),
  status: z
    .enum(["available", "occupied", "cleaning", "maintenance", "blocked"])
    .default("available"),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const bookingSearchSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  adults: z.number().min(1).max(20).default(2),
  children: z.number().min(0).max(10).default(0),
});

export const guestSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  document_type: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  special_requests: z.string().optional().nullable(),
});

export const ratePeriodSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rate_modifier: z.number().min(-100).max(500),
  min_stay: z.number().min(1).default(1),
});

export const availabilityOverrideSchema = z.object({
  room_type_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price_override: z.number().min(0).optional().nullable(),
  available_count: z.number().min(0).optional(),
  min_stay: z.number().min(1).optional(),
  is_closed: z.boolean().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  price_type: z
    .enum(["per_night", "per_stay", "per_person", "per_person_per_night"])
    .default("per_night"),
  is_active: z.boolean().default(true),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type BookingSearchInput = z.infer<typeof bookingSearchSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type RatePeriodInput = z.infer<typeof ratePeriodSchema>;
export type AvailabilityOverrideInput = z.infer<typeof availabilityOverrideSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
