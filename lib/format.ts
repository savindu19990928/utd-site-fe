import type {
  Product,
  ProductVariant,
  RentalProduct,
  RentalProductVariant,
} from "./types";

export const DEPOSIT_MULTIPLIER = 10;

export function formatLKR(
  value: number | string | null | undefined,
  showDecimals = true
): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(num)) return showDecimals ? "Rs. 0.00" : "Rs. 0";
  return `Rs. ${num.toLocaleString("en-LK", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

export function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTimeDisplay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDateDisplay(iso)} ${d.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function toISODateInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Matches API documentation inclusive day calculation:
 * e.g. 2026-11-10 to 2026-11-14 => 5 rental days.
 */
export function countRentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(`${startDate}T00:00:00`);
  const e = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export function getBaseSalePrice(
  product: Pick<Product, "sale_price">,
  variant?: Pick<ProductVariant, "additional_price"> | null
): number {
  const base = parseFloat(product.sale_price ?? "0") || 0;
  const add = variant ? parseFloat(variant.additional_price ?? "0") || 0 : 0;
  return Math.max(0, base + add);
}

export function getEffectiveSalePrice(
  product: Pick<Product, "sale_price" | "discount">,
  variant?: Pick<ProductVariant, "additional_price"> | null
): number {
  const raw = getBaseSalePrice(product, variant);
  const disc = parseFloat(product.discount ?? "0") || 0;
  if (disc > 0 && disc < 100) {
    return Math.round(raw * (1 - disc / 100) * 100) / 100;
  }
  return raw;
}

export function getBaseRentalPrice(
  product: Pick<RentalProduct, "rental_price">,
  variant?: Pick<RentalProductVariant, "additional_rental_price"> | null
): number {
  const base = parseFloat(product.rental_price ?? "0") || 0;
  const add = variant
    ? parseFloat(variant.additional_rental_price ?? "0") || 0
    : 0;
  return Math.max(0, base + add);
}

export function getEffectiveRentalPrice(
  product: Pick<RentalProduct, "rental_price" | "discount">,
  variant?: Pick<RentalProductVariant, "additional_rental_price"> | null
): number {
  const raw = getBaseRentalPrice(product, variant);
  const disc = parseFloat(product.discount ?? "0") || 0;
  if (disc > 0 && disc < 100) {
    return Math.round(raw * (1 - disc / 100) * 100) / 100;
  }
  return raw;
}

export function getEffectiveStock(
  product: Pick<Product | RentalProduct, "stock" | "available_stock">,
  variant?: { stock: number; available_stock?: number } | null
): number {
  if (variant) {
    return Number(variant.available_stock ?? variant.stock ?? 0);
  }
  const avail =
    typeof product.available_stock === "string"
      ? parseInt(product.available_stock, 10)
      : product.available_stock;
  return Number.isFinite(avail) ? Number(avail) : Number(product.stock ?? 0);
}

export function calculateRentalBreakdown(
  dailyPrice: number,
  days: number,
  quantity: number,
  depositMultiplier = DEPOSIT_MULTIPLIER
) {
  const safeDays = Math.max(0, days);
  const safeQty = Math.max(1, quantity);
  const rentalSubtotal = Math.round(dailyPrice * safeDays * safeQty * 100) / 100;
  const securityDeposit =
    Math.round(dailyPrice * depositMultiplier * safeQty * 100) / 100;
  const totalPayable =
    Math.round((rentalSubtotal + securityDeposit) * 100) / 100;
  return {
    days: safeDays,
    quantity: safeQty,
    dailyPrice,
    rentalSubtotal,
    securityDeposit,
    totalPayable,
  };
}

export function getProductPrimaryImage(product: {
  images?: Array<{ image: string; is_primary: boolean; display_order: number }>;
}): string | null {
  if (!product.images || product.images.length === 0) return null;
  const sorted = [...product.images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  });
  return sorted[0]?.image ?? null;
}

export function getProductRatingStats(product: {
  reviews?: Array<{ rating: number; is_approved?: boolean }>;
}) {
  const approved = (product.reviews ?? []).filter((r) => r.is_approved !== false);
  if (approved.length === 0) {
    return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
  }
  const sum = approved.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  const dist = [0, 0, 0, 0, 0];
  for (const r of approved) {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    dist[idx] += 1;
  }
  return {
    average: Math.round((sum / approved.length) * 10) / 10,
    count: approved.length,
    distribution: dist, // [1★, 2★, 3★, 4★, 5★]
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function matchesSlug(name: string, slug: string): boolean {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return slugify(name) === decoded || String(name).toLowerCase() === decoded;
}

export function getMapsHref(taggedLocation: string | null | undefined): string | null {
  if (!taggedLocation) return null;
  const trimmed = taggedLocation.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const coordsMatch = trimmed.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );
  if (coordsMatch) {
    return `https://www.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    trimmed
  )}`;
}

export function getOrderStatusBadgeClasses(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "ACTIVE":
    case "SUCCESS":
    case "DELIVERED":
    case "COMPLETED":
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PROCESSING":
    case "SHIPPED":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "PENDING":
    case "MAINTENANCE":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "CANCELLED":
    case "FAILED":
    case "RETIRED":
      return "bg-red-100 text-red-800 border-red-200";
    case "RETURNED":
    case "REFUNDED":
      return "bg-slate-200 text-slate-800 border-slate-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}
