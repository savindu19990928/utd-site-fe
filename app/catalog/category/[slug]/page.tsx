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
  title: "Category Catalog",
};

async function CategoryCatalogContent({
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

  const matched = categories.find((c) => matchesSlug(c.name, slug)) ?? null;

  return (
    <CatalogExplorer
      products={products}
      categories={categories}
      brands={brands}
      initialCategoryId={matched?.id ?? null}
      bannerTitle={matched ? matched.name : "Equipment"}
      bannerHighlight="Catalog"
      bannerSubtitle={
        matched?.description ||
        "Explore our wide range of construction and DIY tools."
      }
    />
  );
}

export default function CatalogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading category...
        </div>
      }
    >
      <CategoryCatalogContent params={params} />
    </Suspense>
  );
}
