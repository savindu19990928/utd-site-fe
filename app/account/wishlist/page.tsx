"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Wrench } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  formatLKR,
  getEffectiveRentalPrice,
  getEffectiveSalePrice,
  getProductPrimaryImage,
} from "@/lib/format";

export default function WishlistPage() {
  const { wishlistItems, productsById, toggleWishlist, addToCart } = useStore();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
          My Saved Tools ({wishlistItems.length})
        </h1>
        <p className="text-sm text-slate-500">
          Quickly move saved equipment into your purchase cart or book a site rental.
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-900">No saved tools yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click the heart icon on any tool card to bookmark it for your next project.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-block rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-zinc-950"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((w) => {
            const product = productsById[w.product];
            if (!product) return null;
            const img = getProductPrimaryImage(product);
            return (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <Link href={`/product/${product.id}`} className="block space-y-2.5">
                  <div className="relative h-40 w-full bg-white rounded-lg">
                    {img ? (
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        sizes="280px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <Wrench className="m-auto h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-slate-400">{product.sku}</p>
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-base font-extrabold text-slate-950">
                    {product.is_for_sale
                      ? formatLKR(getEffectiveSalePrice(product))
                      : `${formatLKR(getEffectiveRentalPrice(product))} / day`}
                  </p>
                </Link>

                <div className="mt-4 flex items-center gap-2">
                  {product.is_for_sale ? (
                    <button
                      type="button"
                      onClick={() => void addToCart(product, 1, null, true)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] py-2 text-xs font-bold text-zinc-950 hover:bg-[#e09212]"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  ) : (
                    <Link
                      href={`/product/${product.id}?tab=rent`}
                      className="flex flex-1 items-center justify-center rounded-lg bg-[#EA580C] py-2 text-xs font-bold text-white"
                    >
                      Book Rental
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void toggleWishlist(product)}
                    aria-label="Remove from wishlist"
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
