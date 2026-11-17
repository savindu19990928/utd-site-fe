import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { getCachedProduct, getCachedProducts } from "@/lib/catalog-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}): Promise<Metadata> {
  const { skuOrId } = await params;
  const product = await getCachedProduct(skuOrId);
  if (!product) {
    return { title: "Equipment Not Found" };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

async function ProductContent({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}) {
  const { skuOrId } = await params;
  const [product, allProducts] = await Promise.all([
    getCachedProduct(skuOrId),
    getCachedProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={related} />;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading tool specifications...
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
