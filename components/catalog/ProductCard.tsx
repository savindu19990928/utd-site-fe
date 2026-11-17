"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Heart,
  ShoppingCart,
  Star,
  Wrench,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  DEPOSIT_MULTIPLIER,
  formatLKR,
  getBaseSalePrice,
  getEffectiveRentalPrice,
  getEffectiveSalePrice,
  getEffectiveStock,
  getProductPrimaryImage,
  getProductRatingStats,
} from "@/lib/format";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
  preferRent?: boolean;
}

export function ProductCard({
  product,
  view = "grid",
  preferRent = false,
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart, isWishlisted, toggleWishlist } = useStore();

  const img = getProductPrimaryImage(product);
  const altImg =
    product.images && product.images.length > 1 ? product.images[1].image : null;
  const discountPct = parseFloat(product.discount ?? "0") || 0;
  const originalSale = getBaseSalePrice(product);
  const effectiveSale = getEffectiveSalePrice(product);
  const dailyRental = getEffectiveRentalPrice(product);
  const depositAmount = dailyRental * DEPOSIT_MULTIPLIER;
  const stockCount = getEffectiveStock(product);
  const inStock = product.is_available && stockCount > 0;
  const ratingStats = getProductRatingStats(product);
  const wishlisted = isWishlisted(product.id);
  const hasVariants = (product.variants ?? []).some((v) => v.is_active);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      // Navigate to PDP if variant selection is required (§8)
      router.push(`/product/${product.id}`);
      return;
    }
    void addToCart(product, 1, null, true);
  };

  if (view === "list") {
    return (
      <article className="group flex flex-col sm:flex-row gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400/80 hover:shadow-md transition-all">
        <Link
          href={`/product/${product.id}`}
          className="relative h-48 sm:h-44 sm:w-52 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100"
        >
          {discountPct > 0 && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-[#F5A623] px-2 py-0.5 text-xs font-bold text-zinc-950">
              -{Math.round(discountPct)}%
            </span>
          )}
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Wrench className="h-12 w-12" />
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {product.brand_name && (
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {product.brand_name}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-slate-400">
                    {product.sku}
                  </span>
                  {product.is_for_sale && (
                    <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                      FOR SALE
                    </span>
                  )}
                  {product.is_for_rent && (
                    <span className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                      FOR RENT
                    </span>
                  )}
                </div>
                <Link
                  href={`/product/${product.id}`}
                  className="text-base font-bold text-slate-900 hover:text-[#D97706] transition-colors"
                >
                  {product.name}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => void toggleWishlist(product)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`rounded-full p-2 transition-colors ${
                  wishlisted
                    ? "bg-red-50 text-red-500"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
              {product.description}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5 text-[#F5A623]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(ratingStats.average || 5)
                        ? "fill-current"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-800">
                {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "New"}
              </span>
              <span className="text-slate-400">
                ({ratingStats.count} {ratingStats.count === 1 ? "review" : "reviews"})
              </span>
              <span className="ml-2 text-xs font-medium text-emerald-700">
                {inStock ? `${stockCount} in stock` : "Out of stock"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-baseline gap-4">
              {product.is_for_sale && (
                <div>
                  <span className="text-lg font-extrabold text-slate-950">
                    {formatLKR(effectiveSale, false)}
                  </span>
                  {discountPct > 0 && (
                    <span className="ml-2 text-xs text-slate-400 line-through">
                      {formatLKR(originalSale, false)}
                    </span>
                  )}
                </div>
              )}
              {product.is_for_rent && (
                <div className="text-xs">
                  <span className="font-bold text-[#EA580C] text-sm">
                    {formatLKR(dailyRental, false)} / day
                  </span>
                  <span className="ml-1.5 text-slate-500">
                    (Deposit: {formatLKR(depositAmount, false)})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/product/${product.id}`}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                View Details
              </Link>
              {product.is_for_rent && (
                <Link
                  href={`/product/${product.id}?tab=rent`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA580C] px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Book Rental
                </Link>
              )}
              {product.is_for_sale && (
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleQuickAdd}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5A623] px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-[#e09212] disabled:opacity-50"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {hasVariants ? "Select Option" : "Add to Cart"}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Card matching Catalog Showcase & Homepage PNGs
  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-amber-400/80 hover:shadow-md transition-all">
      {/* Top Badges + Wishlist */}
      <div className="relative mb-2.5 aspect-[4/3] w-full overflow-hidden rounded-lg bg-white">
        <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1">
          {discountPct > 0 && (
            <span className="inline-block w-fit rounded-md bg-[#F5A623] px-2 py-0.5 text-[11px] font-extrabold text-zinc-950 shadow-xs">
              -{Math.round(discountPct)}%
            </span>
          )}
          {!product.is_for_sale && product.is_for_rent && (
            <span className="inline-block w-fit rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              FOR RENT
            </span>
          )}
          {product.is_for_sale && product.is_for_rent && preferRent && (
            <span className="inline-block w-fit rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              RENT FLEET
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-1.5 top-1.5 z-10 rounded-full p-1.5 transition-colors ${
            wishlisted
              ? "bg-red-50 text-red-500"
              : "bg-white/90 text-slate-400 hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>

        <Link
          href={`/product/${product.id}${preferRent ? "?tab=rent" : ""}`}
          className="block relative h-full w-full"
        >
          {img ? (
            <>
              <Image
                src={img}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={`object-contain p-2 transition-all duration-300 ${
                  altImg ? "group-hover:opacity-0" : "group-hover:scale-105"
                }`}
              />
              {altImg && (
                <Image
                  src={altImg}
                  alt={`${product.name} alternate view`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300">
              <Wrench className="h-12 w-12" />
            </div>
          )}
        </Link>
      </div>

      {/* Info Block */}
      <div className="flex flex-1 flex-col justify-between text-center sm:text-left">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-slate-500 truncate">
              {product.brand_name || "Universal Tools"}
            </span>
            <span className="font-mono text-slate-400 shrink-0">{product.sku}</span>
          </div>

          <Link
            href={`/product/${product.id}${preferRent ? "?tab=rent" : ""}`}
            className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 hover:text-[#D97706] transition-colors"
          >
            {product.name}
          </Link>

          {/* Rating row matching PNG */}
          <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1 text-xs">
            <div className="flex items-center text-[#F5A623]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(ratingStats.average || 5)
                      ? "fill-current"
                      : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-slate-800">
              {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "5.0"}
            </span>
            <span className="text-slate-400 text-[11px]">
              ({ratingStats.count > 0 ? `${ratingStats.count} reviews` : "Verified"})
            </span>
          </div>
        </div>

        {/* Pricing + CTAs */}
        <div className="mt-3 space-y-2.5">
          {preferRent && product.is_for_rent ? (
            <div>
              <p className="text-base font-extrabold text-[#EA580C]">
                {formatLKR(dailyRental, false)}{" "}
                <span className="text-xs font-medium text-slate-500">/ day</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Deposit: {formatLKR(depositAmount, false)} (100% Refundable)
              </p>
            </div>
          ) : product.is_for_sale ? (
            <div>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-base font-extrabold text-slate-950">
                  {formatLKR(effectiveSale, false)}
                </span>
                {discountPct > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatLKR(originalSale, false)}
                  </span>
                )}
              </div>
              {product.is_for_rent && (
                <p className="mt-0.5 text-[11px] font-medium text-[#EA580C]">
                  Or rent from {formatLKR(dailyRental, false)}/day
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-base font-extrabold text-[#EA580C]">
                {formatLKR(dailyRental, false)}{" "}
                <span className="text-xs font-medium text-slate-500">/ day</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Deposit: {formatLKR(depositAmount, false)}
              </p>
            </div>
          )}

          {preferRent && product.is_for_rent ? (
            <Link
              href={`/product/${product.id}?tab=rent`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EA580C] py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs"
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Check Availability
            </Link>
          ) : product.is_for_sale ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!inStock}
                onClick={handleQuickAdd}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] py-2.5 px-3 text-xs font-bold text-zinc-950 hover:bg-[#e09212] active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                {!inStock
                  ? "Out of Stock"
                  : hasVariants
                  ? "Select Option"
                  : "Add to Cart"}
              </button>
              {product.is_for_rent && (
                <Link
                  href={`/product/${product.id}?tab=rent`}
                  title="Rent this tool"
                  aria-label={`Rent ${product.name}`}
                  className="flex items-center justify-center rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-[#EA580C] hover:bg-orange-100 transition-colors"
                >
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          ) : (
            <Link
              href={`/product/${product.id}?tab=rent`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EA580C] py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors"
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Book Rental
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
