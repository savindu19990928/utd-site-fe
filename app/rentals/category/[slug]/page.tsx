import React, { Suspense } from "react";
import type { Metadata } from "next";
import { RentalCatalogExplorer } from "@/components/rentals/RentalCatalogExplorer";
import {
  getCachedBrands,
  getCachedRentalCategories,
  getCachedRentalProducts,
} from "@/lib/catalog-server";
import { matchesSlug } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rental Category Fleet",
};

async function RentalCategoryContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, categories, brands] = await Promise.all([
    getCachedRentalProducts(),
    getCachedRentalCategories(),
    getCachedBrands(),
  ]);

  const matched = categories.find((c) => matchesSlug(c.name, slug)) ?? null;

  return (
    <RentalCatalogExplorer
      products={products}
      categories={categories}
      brands={brands}
      initialCategoryId={matched?.id ?? null}
      bannerTitle={matched ? matched.name : "Rental"}
      bannerHighlight="Fleet"
      bannerSubtitle={
        matched?.description ||
        "Explore dedicated construction rental equipment and bulk accessories."
      }
    />
  );
}

export default function RentalCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading rental category...
        </div>
      }
    >
      <RentalCategoryContent params={params} />
    </Suspense>
  );
}
