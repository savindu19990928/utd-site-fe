"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Heart,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Wrench,
  X,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  calculateRentalBreakdown,
  countRentalDays,
  DEPOSIT_MULTIPLIER,
  formatDateDisplay,
  formatLKR,
  getBaseSalePrice,
  getEffectiveRentalPrice,
  getEffectiveSalePrice,
  getEffectiveStock,
  getProductRatingStats,
  slugify,
  toISODateInput,
} from "@/lib/format";
import type { Product, ProductReview, ProductVariant } from "@/lib/types";

export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, isWishlisted, toggleWishlist, setRentalDraft, registerProducts } =
    useStore();
  const { showToast } = useToast();

  useEffect(() => {
    registerProducts([product, ...relatedProducts]);
  }, [product, relatedProducts, registerProducts]);

  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active),
    [product.variants]
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants.length > 0 ? activeVariants[0] : null
  );

  const images = useMemo(() => {
    return [...(product.images ?? [])].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.display_order - b.display_order;
    });
  }, [product.images]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const defaultActionTab: "buy" | "rent" =
    searchParams.get("tab") === "rent" && product.is_for_rent
      ? "rent"
      : product.is_for_sale
      ? "buy"
      : "rent";
  const [actionTab, setActionTab] = useState<"buy" | "rent">(defaultActionTab);

  // Purchase state
  const [buyQty, setBuyQty] = useState(1);

  // Rental state
  const todayISO = useMemo(() => toISODateInput(new Date()), []);
  const defaultEndISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toISODateInput(d);
  }, []);

  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(defaultEndISO);
  const [rentQty, setRentQty] = useState(1);
  const [availLoading, setAvailLoading] = useState(false);
  const [availQty, setAvailQty] = useState<number | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);

  // Lower details tab
  const [infoTab, setInfoTab] = useState<"specs" | "description" | "warranty" | "reviews">(
    product.specifications.length > 0 ? "specs" : "description"
  );

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews ?? []);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const activeSku = selectedVariant?.sku || product.sku;
  const stockCount = getEffectiveStock(product, selectedVariant);
  const isInStock = product.is_available && stockCount > 0;
  const baseSale = getBaseSalePrice(product, selectedVariant);
  const effectiveSale = getEffectiveSalePrice(product, selectedVariant);
  const discountPct = parseFloat(product.discount ?? "0") || 0;
  const dailyRental = getEffectiveRentalPrice(product, selectedVariant);
  const rentalDays = countRentalDays(startDate, endDate);
  const rentalBreakdown = calculateRentalBreakdown(
    dailyRental,
    rentalDays,
    rentQty,
    DEPOSIT_MULTIPLIER
  );

  const ratingStats = useMemo(
    () => getProductRatingStats({ reviews }),
    [reviews]
  );

  // Clamp quantity cleanly without triggering synchronous setState in useEffect
  const safeBuyQty = Math.max(1, Math.min(buyQty, Math.max(1, stockCount)));

  const canCheckAvailability =
    actionTab === "rent" &&
    product.is_for_rent &&
    Boolean(startDate && endDate && endDate >= startDate) &&
    isAuthenticated;

  // Real-time fleet availability check when user is authenticated & on rent tab
  useEffect(() => {
    if (!canCheckAvailability) return;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setAvailLoading(true);
        setAvailError(null);
      }
    });

    api
      .checkRentalAvailability({
        product_id: product.id,
        variant_id: selectedVariant?.id ?? null,
        start_date: startDate,
        end_date: endDate,
      })
      .then((res) => {
        if (!cancelled) setAvailQty(res.available_quantity);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailQty(null);
          setAvailError(
            err instanceof ApiError ? err.message : "Could not check availability."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canCheckAvailability, product.id, selectedVariant, startDate, endDate]);

  const effectiveAvailQty = canCheckAvailability ? availQty : null;

  const handleReserveRental = () => {
    if (!startDate || !endDate || endDate < startDate) {
      showToast("End date cannot precede start date.", "error");
      return;
    }
    if (!isAuthenticated) {
      setRentalDraft({
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        quantity: rentQty,
        startDate,
        endDate,
      });
      showToast("Please sign in or register to book construction equipment rentals.", "warning");
      router.push(`/login?redirect=${encodeURIComponent("/rental-checkout")}`);
      return;
    }
    if (effectiveAvailQty !== null && effectiveAvailQty < rentQty) {
      showToast("Equipment is fully booked for these dates.", "error");
      return;
    }
    setRentalDraft({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity: rentQty,
      startDate,
      endDate,
    });
    router.push("/rental-checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please sign in to submit a review.", "warning");
      return;
    }
    if (!reviewComment.trim()) {
      showToast("Please write a short comment about your experience.", "warning");
      return;
    }
    setReviewSubmitting(true);
    try {
      const created = await api.submitReview({
        product: product.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      showToast(
        "Review submitted! It is pending admin approval and is visible to you below.",
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to submit review.",
        "error"
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const wishlisted = isWishlisted(product.id);
  const activeImage = images[activeImageIdx]?.image ?? null;

  return (
    <div className="bg-[#F8FAFC] py-6 sm:py-8">
      <div className="mx-auto max-w-[1400px] px-4 space-y-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product.category_name && (
            <>
              <Link
                href={`/catalog/category/${slugify(product.category_name)}`}
                className="hover:text-slate-900"
              >
                {product.category_name}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* Main 2-Column Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Product Gallery ({images.length})
                </span>
                {activeImage && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Zoom
                  </button>
                )}
              </div>

              <div
                onClick={() => activeImage && setLightboxOpen(true)}
                className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-xl bg-white cursor-zoom-in"
              >
                {discountPct > 0 && (
                  <span className="absolute left-3 top-3 z-10 rounded-lg bg-[#F5A623] px-2.5 py-1 text-xs font-extrabold text-zinc-950">
                    -{Math.round(discountPct)}% OFF
                  </span>
                )}
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Wrench className="h-16 w-16" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageIdx(i)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all ${
                        i === activeImageIdx
                          ? "border-[#F5A623]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Image
                        src={img.image}
                        alt={`${product.name} thumbnail ${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Purchase & Rental Control Center */}
          <div className="lg:col-span-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              {/* Brand, Title, SKU, Ratings */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {product.brand_name && (
                      <Link
                        href={`/catalog/brand/${slugify(product.brand_name)}`}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-[#F5A623]" />
                        {product.brand_name}
                      </Link>
                    )}
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                      SKU: {activeSku}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      !isInStock
                        ? "bg-red-100 text-red-700"
                        : stockCount <= 5
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {!isInStock
                      ? "Out of Stock"
                      : stockCount <= 5
                      ? `Low Stock (${stockCount} left)`
                      : `In Stock (${stockCount} units available)`}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight">
                  {product.name}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setInfoTab("reviews");
                      document.getElementById("product-details-tabs")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 hover:underline"
                  >
                    <div className="flex items-center text-[#F5A623]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(ratingStats.average || 5)
                              ? "fill-current"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900">
                      {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "5.0"}
                    </span>
                    <span className="text-slate-500">
                      ({ratingStats.count} {ratingStats.count === 1 ? "review" : "reviews"})
                    </span>
                  </button>
                  {product.warranty_information && (
                    <span className="inline-flex items-center gap-1 text-slate-600 border-l border-slate-200 pl-3">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {product.warranty_information}
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              {activeVariants.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select {activeVariants[0].name}:{" "}
                    <span className="text-slate-900">
                      {selectedVariant ? selectedVariant.value : "Please select an option"}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((variant) => {
                      const active = selectedVariant?.id === variant.id;
                      const addPrice = parseFloat(variant.additional_price || "0") || 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`rounded-lg border px-3.5 py-2 text-left text-xs font-bold transition-all ${
                            active
                              ? "border-[#F5A623] bg-amber-50 text-amber-950 ring-2 ring-amber-400/30"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <div>{variant.value}</div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {addPrice === 0
                              ? "Standard"
                              : addPrice > 0
                              ? `+${formatLKR(addPrice, false)}`
                              : formatLKR(addPrice, false)}
                            {" • "}
                            {variant.stock} left
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dual Option Tabs: Buy vs Rent */}
              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5 mb-5">
                  <button
                    type="button"
                    disabled={!product.is_for_sale}
                    onClick={() => setActionTab("buy")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
                      actionTab === "buy"
                        ? "bg-[#F5A623] text-zinc-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Buy New
                  </button>
                  <button
                    type="button"
                    disabled={!product.is_for_rent}
                    onClick={() => setActionTab("rent")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
                      actionTab === "rent"
                        ? "bg-[#EA580C] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Rent Tool
                  </button>
                </div>

                {actionTab === "buy" && product.is_for_sale ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-slate-950">
                        {formatLKR(effectiveSale)}
                      </span>
                      {discountPct > 0 && (
                        <>
                          <span className="text-base text-slate-400 line-through">
                            {formatLKR(baseSale)}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            Save {Math.round(discountPct)}%
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setBuyQty(Math.max(1, safeBuyQty - 1))}
                          aria-label="Decrease quantity"
                          className="p-3 text-slate-700 hover:text-slate-950"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[40px] text-center text-sm font-bold">
                          {safeBuyQty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setBuyQty(Math.min(Math.max(1, stockCount), safeBuyQty + 1))
                          }
                          disabled={safeBuyQty >= stockCount}
                          aria-label="Increase quantity"
                          className="p-3 text-slate-700 hover:text-slate-950 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!isInStock || (activeVariants.length > 0 && !selectedVariant)}
                        onClick={() => void addToCart(product, safeBuyQty, selectedVariant, true)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-sm font-extrabold text-zinc-950 shadow-sm hover:bg-[#e09212] transition-all disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {!isInStock ? "Out of Stock" : "Add to Shopping Cart"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleWishlist(product)}
                        aria-label="Save to wishlist"
                        className={`rounded-xl border p-3.5 transition-colors ${
                          wishlisted
                            ? "border-red-300 bg-red-50 text-red-600"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-extrabold text-[#EA580C]">
                          {formatLKR(dailyRental)}
                        </span>
                        <span className="ml-1.5 text-sm font-semibold text-slate-500">
                          / day
                        </span>
                      </div>
                      <span className="rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-[#EA580C]">
                        Min 1 Day &bull; 10x Deposit
                      </span>
                    </div>

                    {/* Date Range Picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          min={todayISO}
                          value={startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStartDate(val);
                            if (endDate < val) setEndDate(val);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-[#EA580C] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          min={startDate || todayISO}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-[#EA580C] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Units Needed
                        </label>
                        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setRentQty((q) => Math.max(1, q - 1))}
                            className="p-1 text-slate-700"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-bold">{rentQty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setRentQty((q) =>
                                Math.min(effectiveAvailQty ?? Math.max(1, stockCount), q + 1)
                              )
                            }
                            className="p-1 text-slate-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Availability Banner */}
                    {endDate < startDate ? (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        End date cannot precede start date.
                      </div>
                    ) : !isAuthenticated ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                        <span className="font-medium">
                          Sign in to verify live fleet calendar availability &amp; lock booking ({stockCount} total units in depot).
                        </span>
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/product/${product.id}?tab=rent`)}`}
                          className="shrink-0 font-bold text-[#D97706] underline"
                        >
                          Sign In
                        </Link>
                      </div>
                    ) : availLoading ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-600">
                        Checking live fleet calendar availability...
                      </div>
                    ) : availError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                        {availError}
                      </div>
                    ) : effectiveAvailQty !== null && effectiveAvailQty >= rentQty ? (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Available for Selected Dates ({effectiveAvailQty} units in fleet)
                      </div>
                    ) : effectiveAvailQty !== null ? (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Unavailable for these dates. Please adjust your rental period.
                      </div>
                    ) : null}

                    {/* Transparent 10x Deposit Breakdown (§6.3) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Daily Rate</span>
                        <span className="font-semibold text-slate-900">
                          {formatLKR(dailyRental)} / day
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Duration</span>
                        <span className="font-semibold text-slate-900">
                          {rentalDays} {rentalDays === 1 ? "Day" : "Days"} (
                          {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Rental Fee ({rentQty} unit{rentQty > 1 ? "s" : ""})</span>
                        <span className="font-semibold text-slate-900">
                          {formatLKR(rentalBreakdown.rentalSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>
                          Refundable Deposit ({DEPOSIT_MULTIPLIER}x Daily Rate &ndash; 100% Refundable)
                        </span>
                        <span className="font-bold text-slate-950">
                          {formatLKR(rentalBreakdown.securityDeposit)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-950">
                        <span>Total Due Now</span>
                        <span>{formatLKR(rentalBreakdown.totalPayable)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <span>
                        The security deposit of{" "}
                        <strong>{formatLKR(rentalBreakdown.securityDeposit)}</strong> is fully
                        refunded immediately upon safe return and inspection of the equipment.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReserveRental}
                      disabled={
                        endDate < startDate ||
                        (isAuthenticated && effectiveAvailQty !== null && effectiveAvailQty < rentQty)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-700 transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <CalendarClock className="h-4 w-4" />
                      Reserve for Rental
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Details Tabs */}
        <section
          id="product-details-tabs"
          className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
        >
          <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
            {[
              {
                id: "specs",
                label: `Technical Specifications (${product.specifications.length})`,
              },
              { id: "description", label: "Description & Applications" },
              { id: "warranty", label: "Warranty & Rental Terms" },
              { id: "reviews", label: `Customer Reviews (${ratingStats.count})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setInfoTab(tab.id as "specs" | "description" | "warranty" | "reviews")
                }
                className={`rounded-t-lg px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                  infoTab === tab.id
                    ? "border-[#F5A623] bg-white text-slate-950"
                    : "border-transparent text-slate-600 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {infoTab === "specs" && (
              <div>
                {product.specifications.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Detailed specifications are listed in the product description.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-200">
                        {product.specifications.map((spec, idx) => (
                          <tr
                            key={spec.id}
                            className={idx % 2 === 0 ? "bg-slate-50/70" : "bg-white"}
                          >
                            <th className="w-1/3 px-4 py-3 text-left font-bold text-slate-700">
                              {spec.name}
                            </th>
                            <td className="px-4 py-3 font-mono text-slate-900">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {infoTab === "description" && (
              <div className="prose prose-slate max-w-none space-y-3 text-sm leading-relaxed text-slate-700">
                <p>{product.description}</p>
                <p>
                  Engineered for Sri Lankan construction conditions, workshop fabrication, and heavy contractor duty cycles. Available for direct islandwide delivery or pickup from Universal Tool Depot, Colombo 03.
                </p>
              </div>
            )}

            {infoTab === "warranty" && (
              <div className="space-y-4 text-sm text-slate-700">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-bold text-emerald-900">Manufacturer / Depot Warranty</p>
                  <p className="mt-1 text-emerald-800">
                    {product.warranty_information || "Standard Universal Tool Depot Quality Guarantee"}
                  </p>
                </div>
                {product.is_for_rent && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5">
                    <p className="font-bold text-amber-950">
                      Equipment Rental Inspection &amp; Deposit Policy
                    </p>
                    <p className="text-amber-900">
                      Rentals include a 100% refundable 10x security deposit ({formatLKR(dailyRental * 10)}) held while the tool is on site. Return equipment clean and undamaged to receive immediate deposit release.
                    </p>
                  </div>
                )}
              </div>
            )}

            {infoTab === "reviews" && (
              <div id="reviews" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Summary + Rating Distribution */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-slate-950">
                        {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "—"}
                      </span>
                      <div>
                        <div className="flex text-[#F5A623]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(ratingStats.average)
                                  ? "fill-current"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Based on {ratingStats.count} verified reviews
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingStats.distribution[star - 1] ?? 0;
                        const pct =
                          ratingStats.count > 0
                            ? Math.round((count / ratingStats.count) * 100)
                            : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-8 font-bold text-slate-700">{star}★</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-[#F5A623]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-slate-500">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Write Review Form */}
                  <div className="rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Write a Review
                    </h3>
                    {isAuthenticated ? (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Your Rating
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setReviewRating(s)}
                                aria-label={`Rate ${s} stars`}
                                className="p-1"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    s <= reviewRating
                                      ? "fill-[#F5A623] text-[#F5A623]"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          rows={3}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share performance feedback from your job site..."
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="w-full rounded-lg bg-[#F5A623] py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#e09212] disabled:opacity-50"
                        >
                          {reviewSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-600">
                        <Link href="/login" className="font-bold text-[#D97706] underline">
                          Sign in
                        </Link>{" "}
                        to rate and review this equipment.
                      </p>
                    )}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-8 space-y-3">
                  {reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No reviews yet for this tool. Be the first contractor to share feedback!
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-slate-200 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex text-[#F5A623]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < rev.rating ? "fill-current" : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            {!rev.is_approved && rev.user === user?.id && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                Pending Moderation
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDateDisplay(rev.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Equipment */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Related Tools &amp; Machinery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-amber-400 transition-all"
                >
                  <Link href={`/product/${rel.id}`} className="block space-y-2">
                    <div className="relative h-36 w-full bg-white">
                      {rel.images?.[0]?.image ? (
                        <Image
                          src={rel.images[0].image}
                          alt={rel.name}
                          fill
                          sizes="260px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <Wrench className="m-auto h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-bold text-slate-900">
                      {rel.name}
                    </p>
                    <p className="text-sm font-extrabold text-slate-950">
                      {rel.is_for_sale
                        ? formatLKR(getEffectiveSalePrice(rel), false)
                        : `${formatLKR(getEffectiveRentalPrice(rel), false)} / day`}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom view"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative h-[80vh] w-full max-w-4xl bg-white rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="100vw"
              className="object-contain p-6"
            />
          </div>
        </div>
      )}
    </div>
  );
}
