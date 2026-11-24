"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Star, Wrench } from "lucide-react";
import {
  DEPOSIT_MULTIPLIER,
  formatLKR,
  getBaseRentalPrice,
  getEffectiveRentalPrice,
  getEffectiveStock,
  getProductPrimaryImage,
  getProductRatingStats,
} from "@/lib/format";
import type { RentalProduct } from "@/lib/types";

interface RentalProductCardProps {
  product: RentalProduct;
  view?: "grid" | "list";
}

export function RentalProductCard({
  product,
  view = "grid",
}: RentalProductCardProps) {
  const img = getProductPrimaryImage(product);
  const altImg =
    product.images && product.images.length > 1 ? product.images[1].image : null;
  const discountPct = parseFloat(product.discount ?? "0") || 0;
  const baseDaily = getBaseRentalPrice(product);
  const dailyRental = getEffectiveRentalPrice(product);
  const depositAmount = dailyRental * DEPOSIT_MULTIPLIER;
  const stockCount = getEffectiveStock(product);
  const inStock = product.is_available && stockCount > 0;
  const ratingStats = getProductRatingStats(product);

  if (view === "list") {
    return (
      <article className="group flex flex-col sm:flex-row gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-[#EA580C]/70 hover:shadow-md transition-all">
        <Link
          href={`/rentals/${product.id}`}
          className="relative h-48 sm:h-44 sm:w-52 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100"
        >
          {discountPct > 0 && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-[#EA580C] px-2 py-0.5 text-xs font-bold text-white">
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
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {product.brand_name && (
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {product.brand_name}
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-400">
                {product.sku}
              </span>
            </div>
            <Link
              href={`/rentals/${product.id}`}
              className="text-base font-bold text-slate-900 hover:text-[#EA580C] transition-colors"
            >
              {product.name}
            </Link>

            <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
              {product.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "5.0"}
              </span>
              <span className="text-slate-400">
                ({ratingStats.count}{" "}
                {ratingStats.count === 1 ? "review" : "reviews"})
              </span>
              <span
                className={`ml-2 text-xs font-semibold ${
                  inStock ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {!inStock ? "Fleet Busy / Unavailable" : `${stockCount} available`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-[#EA580C]">
                  {formatLKR(dailyRental, false)}
                  <span className="text-xs font-medium text-slate-500"> / day</span>
                </span>
                {discountPct > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatLKR(baseDaily, false)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Refundable Deposit: {formatLKR(depositAmount, false)}
              </p>
            </div>

            <Link
              href={`/rentals/${product.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA580C] px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Check Availability &amp; Book
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-[#EA580C]/70 hover:shadow-md transition-all">
      <div className="relative mb-2.5 aspect-[4/3] w-full overflow-hidden rounded-lg bg-white">
        {discountPct > 0 && (
          <div className="absolute left-1.5 top-1.5 z-10">
            <span className="inline-block w-fit rounded-md bg-[#EA580C] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
              -{Math.round(discountPct)}%
            </span>
          </div>
        )}

        <Link href={`/rentals/${product.id}`} className="block relative h-full w-full">
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

      <div className="flex flex-1 flex-col justify-between text-center sm:text-left">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-slate-500 truncate">
              {product.brand_name || "Universal Tools"}
            </span>
            <span className="font-mono text-slate-400 shrink-0">{product.sku}</span>
          </div>

          <Link
            href={`/rentals/${product.id}`}
            className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 hover:text-[#EA580C] transition-colors"
          >
            {product.name}
          </Link>

          <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 text-xs">
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
            <span
              className={`text-[11px] font-semibold ${
                inStock ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {inStock ? `${stockCount} available` : "Unavailable"}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <div>
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <p className="text-base font-extrabold text-[#EA580C]">
                {formatLKR(dailyRental, false)}{" "}
                <span className="text-xs font-medium text-slate-500">/ day</span>
              </p>
              {discountPct > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  {formatLKR(baseDaily, false)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Deposit: {formatLKR(depositAmount, false)} (100% Refundable)
            </p>
          </div>

          <Link
            href={`/rentals/${product.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EA580C] py-2.5 px-3 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs"
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Check Availability &amp; Book
          </Link>
        </div>
      </div>
    </article>
  );
}
