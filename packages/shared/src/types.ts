export type OrganizationStatus = "onboarding" | "active" | "suspended" | "cancelled";
export type OrganizationPlan = "starter" | "pro" | "business";
export type MemberRole = "owner" | "manager" | "receptionist" | "housekeeper";
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance" | "blocked";
export type HousekeepingStatus = "clean" | "dirty" | "in_progress" | "inspected";
export type BookingStatus = "pending_payment" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "paid" | "partial_refund" | "refunded" | "failed";
export type BookingSource = "widget" | "dashboard" | "phone" | "walk_in";
export type PriceType = "per_night" | "per_stay" | "per_person" | "per_person_per_night";
export type HousekeepingTaskType = "checkout" | "stay" | "deep_clean";
export type HousekeepingTaskStatus = "pending" | "in_progress" | "completed" | "inspected";
export type TransactionType = "charge" | "refund" | "payout" | "adjustment";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  star_rating: number | null;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  checkin_time: string;
  checkout_time: string;
  cancellation_policy: { type: string; hours_before: number };
  tax_percentage: number;
  tourism_tax: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  plan: OrganizationPlan;
  commission_rate: number;
  status: OrganizationStatus;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  base_occupancy: number;
  max_occupancy: number;
  max_children: number;
  base_price: number;
  extra_person_charge: number;
  size_sqm: number | null;
  bed_type: string | null;
  photos: string[];
  amenities: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  organization_id: string;
  room_type_id: string;
  room_number: string;
  floor: string | null;
  status: RoomStatus;
  housekeeping_status: HousekeepingStatus;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  room_type?: RoomType;
}

export interface Booking {
  id: string;
  organization_id: string;
  booking_code: string;
  guest_id: string;
  room_type_id: string;
  room_id: string | null;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  adults: number;
  children: number;
  subtotal: number;
  extras_total: number;
  taxes: number;
  total: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
  net_hotel: number;
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  status: BookingStatus;
  source: BookingSource;
  special_requests: string | null;
  internal_notes: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  guest?: Guest;
  room_type?: RoomType;
  room?: Room;
}

export interface Guest {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  nationality: string | null;
  notes: string | null;
  total_stays: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  price_type: PriceType;
  is_active: boolean;
  created_at: string;
}

export interface RatePeriod {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  rate_modifier: number;
  min_stay: number;
  created_at: string;
}

export interface Availability {
  id: string;
  room_type_id: string;
  date: string;
  price_override: number | null;
  available_count: number;
  min_stay: number;
  is_closed: boolean;
  cta_closed: boolean;
  ctd_closed: boolean;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  is_active: boolean;
  created_at: string;
}
