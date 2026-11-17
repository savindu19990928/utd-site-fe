import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedProducts,
} from "@/lib/catalog-server";

export const metadata: Metadata = {
  title: "Equipment Rental Fleet",
  description:
    "Rent heavy construction machinery, concrete demolition hammers, welders, and power tools across Sri Lanka with transparent 10x refundable deposits.",
};

async function RentalsCatalogContent() {
  const [products, categories, brands] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedBrands(),
  ]);

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

      <CatalogExplorer
        products={products}
        categories={categories}
        brands={brands}
        initialMode="rent"
        bannerTitle="Rental"
        bannerHighlight="Fleet"
        bannerSubtitle="Industrial demolition hammers, welders, hoists, and power tools ready for your job site."
      />
    </>
  );
}

export default function RentalsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading rental fleet...
        </div>
      }
    >
      <RentalsCatalogContent />
    </Suspense>
  );
}
