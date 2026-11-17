"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatLKR } from "@/lib/format";

export function CartDrawer() {
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    isCartDrawerOpen,
    closeCartDrawer,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  } = useStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartDrawerOpen) closeCartDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  if (!isCartDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={closeCartDrawer}
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#141414] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#F5A623]" aria-hidden="true" />
            <h2 className="text-base font-bold">
              Shopping Cart ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Close cart drawer"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-[#F5A623]">
                <ShoppingBag className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="text-base font-bold text-slate-900">Your cart is empty</p>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                Browse contractor-grade power tools, accessories, or workshop essentials to get started.
              </p>
              <Link
                href="/catalog"
                onClick={closeCartDrawer}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-[#e09212]"
              >
                Explore Catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 rounded-xl border border-slate-200 bg-white p-3"
              >
                <Link
                  href={`/product/${item.productId}`}
                  onClick={closeCartDrawer}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={closeCartDrawer}
                        className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-[#D97706]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {item.sku}
                      </p>
                      {item.variantLabel && (
                        <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {item.variantLabel}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(item, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="p-1.5 text-slate-600 hover:text-slate-950"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[28px] text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(item, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxStock}
                        aria-label="Increase quantity"
                        className="p-1.5 text-slate-600 hover:text-slate-950 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatLKR(item.subtotal)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatLKR(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatLKR(cartSubtotal)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Delivery &amp; promo coupons calculated at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5A623] py-3 text-sm font-bold text-zinc-950 hover:bg-[#e09212] transition-colors shadow-xs"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  onClick={closeCartDrawer}
                  className="flex items-center justify-center rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  View Full Cart
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secure SSL Checkout &bull; Fast Job-Site Dispatch
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
