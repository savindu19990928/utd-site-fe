"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatLKR } from "@/lib/format";

export default function CartPage() {
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  } = useStore();

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              Shopping Cart ({cartCount})
            </h1>
            <p className="text-sm text-slate-600">
              Review your equipment purchase quantities before job-site checkout.
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={() => void clearCart()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Your shopping cart is empty</h2>
            <p className="mt-1 text-sm text-slate-500">
              Explore our catalog of contractor power tools, safety gear, and workshop kits.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#F5A623] px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-[#e09212]"
            >
              Browse Equipment Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items Table */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-200">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        className="relative h-20 w-20 shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-contain p-1.5"
                          />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.productId}`}
                          className="text-sm sm:text-base font-bold text-slate-900 hover:text-[#D97706] line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">{item.sku}</p>
                        {item.variantLabel && (
                          <span className="mt-1 inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            {item.variantLabel}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          Unit Price: {formatLKR(item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-5">
                      <div>
                        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              void updateCartItemQuantity(item, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="p-2 text-slate-700 hover:text-slate-950"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[32px] text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void updateCartItemQuantity(item, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Increase quantity"
                            className="p-2 text-slate-700 hover:text-slate-950 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {item.quantity >= item.maxStock && (
                          <p className="mt-1 text-[10px] font-semibold text-amber-700 text-center">
                            Max stock reached
                          </p>
                        )}
                      </div>

                      <div className="text-right min-w-[110px]">
                        <p className="text-base font-extrabold text-slate-950">
                          {formatLKR(item.subtotal)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeCartItem(item)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Order Summary
              </h2>
              <div className="space-y-2.5 text-sm border-b border-slate-200 pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Items ({cartCount})</span>
                  <span className="font-semibold text-slate-900">
                    {formatLKR(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="text-xs font-medium text-slate-500">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900">Estimated Total</span>
                <span className="text-2xl font-extrabold text-slate-950">
                  {formatLKR(cartSubtotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-3.5 text-sm font-extrabold text-zinc-950 shadow-sm hover:bg-[#e09212]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Secure SSL Checkout &bull; Direct Bank Transfer
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#F5A623]" />
                  Fast Job-Site Dispatch Across Sri Lanka
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
