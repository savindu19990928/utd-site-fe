import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedProducts,
} from "@/lib/catalog-server";
import { matchesSlug } from "@/lib/format";

export const metadata: Metadata = {
  title: "Brand Catalog",
};

async function BrandCatalogContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, categories, brands] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedBrands(),
  ]);

  const matched = brands.find((b) => matchesSlug(b.name, slug)) ?? null;

  return (
    <CatalogExplorer
      products={products}
      categories={categories}
      brands={brands}
      initialBrandId={matched?.id ?? null}
      bannerTitle={matched ? matched.name : "Verified"}
      bannerHighlight="Equipment"
      bannerSubtitle={
        matched
          ? `Genuine ${matched.name} tools and rental machinery backed by official warranty.`
          : "Explore contractor-grade tools from trusted industrial brands."
      }
    />
  );
}

export default function CatalogBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading brand catalog...
        </div>
      }
    >
      <BrandCatalogContent params={params} />
    </Suspense>
  );
}
