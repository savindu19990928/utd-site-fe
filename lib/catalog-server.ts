import { cacheLife, cacheTag } from "next/cache";
import type {
  Brand,
  Category,
  Coupon,
  Product,
  ProductReview,
  RentalCategory,
  RentalProduct,
  RentalProductReview,
} from "./types";

const API_BASE = "https://api.universaltooldepot.lk";

async function safeFetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getCachedCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "categories");
  return safeFetchJson<Category[]>("/api/categories/", []);
}

export async function getCachedBrands(): Promise<Brand[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "brands");
  return safeFetchJson<Brand[]>("/api/brands/", []);
}

export async function getCachedProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products");
  return safeFetchJson<Product[]>("/api/products/", []);
}

export async function getCachedProduct(skuOrId: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `product:${skuOrId}`);
  const isNumeric = /^\d+$/.test(skuOrId);
  if (isNumeric) {
    const direct = await safeFetchJson<Product | null>(
      `/api/products/${skuOrId}/`,
      null
    );
    if (direct && direct.id) return direct;
  }
  const all = await getCachedProducts();
  const decoded = decodeURIComponent(skuOrId).toLowerCase();
  return (
    all.find(
      (p) => String(p.id) === decoded || p.sku.toLowerCase() === decoded
    ) ?? null
  );
}

export async function getCachedPublicReviews(): Promise<ProductReview[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "reviews");
  return safeFetchJson<ProductReview[]>("/api/product-reviews/", []);
}

export async function getCachedActiveCoupons(): Promise<Coupon[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "coupons");
  return safeFetchJson<Coupon[]>("/api/coupons/", []);
}

// ==========================================
// Separate Rental Catalog Server Fetchers
// ==========================================

export async function getCachedRentalCategories(): Promise<RentalCategory[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rental-catalog", "rental-categories");
  return safeFetchJson<RentalCategory[]>("/api/rental-categories/", []);
}

export async function getCachedRentalProducts(): Promise<RentalProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rental-catalog", "rental-products");
  return safeFetchJson<RentalProduct[]>("/api/rental-products/", []);
}

export async function getCachedRentalProduct(
  skuOrId: string
): Promise<RentalProduct | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rental-catalog", `rental-product:${skuOrId}`);
  const isNumeric = /^\d+$/.test(skuOrId);
  if (isNumeric) {
    const direct = await safeFetchJson<RentalProduct | null>(
      `/api/rental-products/${skuOrId}/`,
      null
    );
    if (direct && direct.id) return direct;
  }
  const all = await getCachedRentalProducts();
  const decoded = decodeURIComponent(skuOrId).toLowerCase();
  return (
    all.find(
      (p) => String(p.id) === decoded || p.sku.toLowerCase() === decoded
    ) ?? null
  );
}

export async function getCachedPublicRentalReviews(): Promise<
  RentalProductReview[]
> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rental-catalog", "rental-reviews");
  return safeFetchJson<RentalProductReview[]>(
    "/api/rental-product-reviews/",
    []
  );
}
