export const AMENITIES = [
  "wifi",
  "ac",
  "heating",
  "tv",
  "minibar",
  "safe",
  "desk",
  "balcony",
  "sea_view",
  "pool_view",
  "garden_view",
  "bathtub",
  "shower",
  "hair_dryer",
  "iron",
  "coffee_maker",
  "kitchen",
  "washer",
  "parking",
  "room_service",
] as const;

export const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  ac: "Aire acondicionado",
  heating: "Calefacción",
  tv: "TV",
  minibar: "Minibar",
  safe: "Caja fuerte",
  desk: "Escritorio",
  balcony: "Balcón",
  sea_view: "Vista al mar",
  pool_view: "Vista a piscina",
  garden_view: "Vista al jardín",
  bathtub: "Bañera",
  shower: "Ducha",
  hair_dryer: "Secador de pelo",
  iron: "Plancha",
  coffee_maker: "Cafetera",
  kitchen: "Cocina",
  washer: "Lavadora",
  parking: "Parking",
  room_service: "Servicio a habitación",
};

export const BED_TYPES = [
  { value: "king", label: "King" },
  { value: "queen", label: "Queen" },
  { value: "double", label: "Doble" },
  { value: "twin", label: "Twin" },
  { value: "single", label: "Individual" },
  { value: "bunk", label: "Litera" },
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  checked_in: "Check-in",
  checked_out: "Check-out",
  cancelled: "Cancelada",
  no_show: "No show",
};

export const ROOM_STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  cleaning: "En limpieza",
  maintenance: "Mantenimiento",
  blocked: "Bloqueada",
};

export const CURRENCIES = [
  { value: "MXN", label: "Peso mexicano (MXN)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "COP", label: "Peso colombiano (COP)" },
  { value: "ARS", label: "Peso argentino (ARS)" },
] as const;

export const DEFAULT_COMMISSION_RATE = 5.0;
export const DEFAULT_TAX_PERCENTAGE = 16.0;
export const DEFAULT_CHECKIN_TIME = "15:00";
export const DEFAULT_CHECKOUT_TIME = "11:00";
export const DEFAULT_CANCELLATION_HOURS = 48;
