export function generateBookingCode(orgSlug: string): string {
  const prefix = orgSlug.substring(0, 3).toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateNights(checkin: string, checkout: string): number {
  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getOccupancyPercentage(
  occupiedRooms: number,
  totalRooms: number
): number {
  if (totalRooms === 0) return 0;
  return Math.round((occupiedRooms / totalRooms) * 100);
}

export function calculateTotalWithTax(
  subtotal: number,
  taxPercentage: number,
  tourismTax = 0
): { taxes: number; tourismTaxAmount: number; total: number } {
  const taxes = subtotal * (taxPercentage / 100);
  const tourismTaxAmount = tourismTax;
  return {
    taxes: Math.round(taxes * 100) / 100,
    tourismTaxAmount,
    total: Math.round((subtotal + taxes + tourismTaxAmount) * 100) / 100,
  };
}

export function calculateCommission(
  total: number,
  commissionRate: number
): { commission: number; netHotel: number } {
  const commission = Math.round(total * (commissionRate / 100) * 100) / 100;
  return {
    commission,
    netHotel: Math.round((total - commission) * 100) / 100,
  };
}
