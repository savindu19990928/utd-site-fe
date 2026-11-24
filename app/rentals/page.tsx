import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Cpu, MapPin, ShieldCheck } from "lucide-react";
import { RentalCatalogExplorer } from "@/components/rentals/RentalCatalogExplorer";
import {
  getCachedBrands,
  getCachedRentalCategories,
  getCachedRentalProducts,
} from "@/lib/catalog-server";

export const metadata: Metadata = {
  title: "Equipment Rental Fleet",
  description:
    "Rent heavy construction machinery, floor polishers tracked by machine number, concrete breakers, and bulk scaffolding clamps across Sri Lanka.",
};

async function RentalsCatalogContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const [products, categories, brands] = await Promise.all([
    getCachedRentalProducts(),
    getCachedRentalCategories(),
    getCachedBrands(),
  ]);

  const search = typeof sp.search === "string" ? sp.search : "";
  const initialCategoryId =
    typeof sp.category === "string" && /^\d+$/.test(sp.category)
      ? Number(sp.category)
      : null;
  const initialBrandId =
    typeof sp.brand === "string" && /^\d+$/.test(sp.brand)
      ? Number(sp.brand)
      : null;
  const initialTracking =
    sp.tracking === "bulk" || sp.tracking === "numbered" ? sp.tracking : "all";

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-slate-200">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <CalendarClock className="h-4 w-4 text-[#EA580C]" />
              Min Rental: 1 Day (Calendar-Verified Fleet)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-indigo-400" />
              Bulk Stock &amp; Machine-Numbered Tracking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              10x Daily Rate Refundable Deposit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#F5A623]" />
              GPS Job-Site Dispatch Available
            </span>
          </div>
          <Link
            href="/terms-and-conditions#rental"
            className="inline-flex items-center gap-1 font-bold text-[#F5A623] hover:underline"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Read Deposit &amp; Return Policy
          </Link>
        </div>
      </div>

      <RentalCatalogExplorer
        products={products}
        categories={categories}
        brands={brands}
        initialCategoryId={initialCategoryId}
        initialBrandId={initialBrandId}
        initialSearch={search}
        initialTracking={initialTracking}
        bannerTitle="Rental"
        bannerHighlight="Fleet"
        bannerSubtitle="Machine-numbered heavy equipment & bulk construction gear ready for immediate site dispatch."
      />
    </>
  );
}

export default function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading rental fleet...
        </div>
      }
    >
      <RentalsCatalogContent searchParams={searchParams} />
    </Suspense>
  );
}
