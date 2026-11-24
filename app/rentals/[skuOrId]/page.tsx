import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RentalDetailClient } from "@/components/rentals/RentalDetailClient";
import {
  getCachedRentalProduct,
  getCachedRentalProducts,
} from "@/lib/catalog-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}): Promise<Metadata> {
  const { skuOrId } = await params;
  const product = await getCachedRentalProduct(skuOrId);
  if (!product) {
    return { title: "Rental Equipment Not Found" };
  }
  return {
    title: `${product.name} (Rental)`,
    description: product.description,
  };
}

async function RentalDetailContent({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}) {
  const { skuOrId } = await params;
  const [product, allRentals] = await Promise.all([
    getCachedRentalProduct(skuOrId),
    getCachedRentalProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const related = allRentals
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return <RentalDetailClient product={product} relatedProducts={related} />;
}

export default function RentalProductPage({
  params,
}: {
  params: Promise<{ skuOrId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
          Loading rental equipment details...
        </div>
      }
    >
      <RentalDetailContent params={params} />
    </Suspense>
  );
}
