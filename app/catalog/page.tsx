import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedProducts,
} from "@/lib/catalog-server";

export const metadata: Metadata = {
  title: "Our Catalog",
  description:
    "Explore Universal Tool Depot's complete catalog of contractor power tools, welding machines, pressure washers, and hand tools.",
};

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const [products, categories, brands] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedBrands(),
  ]);

  const search = typeof sp.search === "string" ? sp.search : "";
  const initialMode =
    sp.for_rent === "true"
      ? "rent"
      : sp.for_sale === "true"
      ? "sale"
      : "all";
  const initialCategoryId =
    typeof sp.category === "string" && /^\d+$/.test(sp.category)
      ? Number(sp.category)
      : null;

  return (
    <CatalogExplorer
      products={products}
      categories={categories}
      brands={brands}
      initialSearch={search}
      initialMode={initialMode}
      initialCategoryId={initialCategoryId}
    />
  );
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading equipment catalog...
        </div>
      }
    >
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  );
}
