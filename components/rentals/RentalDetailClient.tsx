"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Info,
  Layers,
  Minus,
  Plus,
  ShieldCheck,
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
  getBaseRentalPrice,
  getEffectiveRentalPrice,
  getEffectiveStock,
  getProductRatingStats,
  slugify,
  toISODateInput,
} from "@/lib/format";
import type {
  RentalAvailabilityResponse,
  RentalProduct,
  RentalProductReview,
  RentalProductVariant,
} from "@/lib/types";

export function RentalDetailClient({
  product,
  relatedProducts,
}: {
  product: RentalProduct;
  relatedProducts: RentalProduct[];
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    rentalDraft,
    addRentalDraftItem,
    registerRentalProducts,
  } = useStore();
  const { showToast } = useToast();

  useEffect(() => {
    registerRentalProducts([product, ...relatedProducts]);
  }, [product, relatedProducts, registerRentalProducts]);

  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active),
    [product.variants]
  );

  const [selectedVariant, setSelectedVariant] =
    useState<RentalProductVariant | null>(
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

  const todayISO = useMemo(() => toISODateInput(new Date()), []);
  const defaultEndISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toISODateInput(d);
  }, []);

  const [startDate, setStartDate] = useState(
    () => rentalDraft?.startDate || todayISO
  );
  const [endDate, setEndDate] = useState(
    () => rentalDraft?.endDate || defaultEndISO
  );
  const [rentQty, setRentQty] = useState(1);

  const [availLoading, setAvailLoading] = useState(false);
  const [availability, setAvailability] =
    useState<RentalAvailabilityResponse | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);

  const [infoTab, setInfoTab] = useState<
    "specs" | "description" | "policy" | "reviews"
  >(product.specifications.length > 0 ? "specs" : "description");

  const [reviews, setReviews] = useState<RentalProductReview[]>(
    product.reviews ?? []
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const activeSku = selectedVariant?.sku || product.sku;
  const stockCount = getEffectiveStock(product, selectedVariant);
  const isInStock = product.is_available && stockCount > 0;
  const baseDaily = getBaseRentalPrice(product, selectedVariant);
  const dailyRental = getEffectiveRentalPrice(product, selectedVariant);
  const discountPct = parseFloat(product.discount ?? "0") || 0;
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

  const canCheckAvailability =
    Boolean(startDate && endDate && endDate >= startDate) && isAuthenticated;

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
        rental_product_id: product.id,
        rental_variant_id: selectedVariant?.id ?? null,
        start_date: startDate,
        end_date: endDate,
      })
      .then((res) => {
        if (!cancelled) setAvailability(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailability(null);
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

  const effectiveAvailQty = canCheckAvailability
    ? availability?.available_quantity ?? null
    : null;
  const maxSelectableQty = Math.max(1, effectiveAvailQty ?? stockCount);

  const handleAddAndProceed = (goCheckout: boolean) => {
    if (!startDate || !endDate || endDate < startDate) {
      showToast("End date cannot precede start date.", "error");
      return;
    }
    if (effectiveAvailQty !== null && effectiveAvailQty < rentQty) {
      showToast("Insufficient units available for these dates.", "error");
      return;
    }

    addRentalDraftItem(
      {
        rentalProductId: product.id,
        rentalVariantId: selectedVariant?.id ?? null,
        quantity: rentQty,
      },
      { startDate, endDate }
    );

    if (!goCheckout) {
      showToast(
        `Added ${rentQty}x ${product.name} to your multi-item rental booking.`,
        "success"
      );
      return;
    }

    if (!isAuthenticated) {
      showToast(
        "Please sign in or register to complete your equipment rental booking.",
        "warning"
      );
      router.push(`/login?redirect=${encodeURIComponent("/rental-checkout")}`);
      return;
    }
    router.push("/rental-checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please sign in to submit a rental review.", "warning");
      return;
    }
    if (!reviewComment.trim()) {
      showToast("Please write a short comment about this equipment.", "warning");
      return;
    }
    setReviewSubmitting(true);
    try {
      const created = await api.submitRentalReview({
        rental_product: product.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      showToast(
        "Rental review submitted! It is pending admin approval.",
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

  const activeImage = images[activeImageIdx]?.image ?? null;
  const draftCount = rentalDraft?.items.length ?? 0;

  return (
    <div className="bg-[#F8FAFC] py-6 sm:py-8">
      <div className="mx-auto max-w-[1400px] px-4 space-y-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500"
        >
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/rentals" className="hover:text-slate-900">
            Rental Fleet
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product.category_name && (
            <>
              <Link
                href={`/rentals/category/${slugify(product.category_name)}`}
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
                  Rental Equipment Gallery ({images.length})
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
                  <span className="absolute left-3 top-3 z-10 rounded-lg bg-[#EA580C] px-2.5 py-1 text-xs font-extrabold text-white">
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
                          ? "border-[#EA580C]"
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

          {/* Right Column: Rental Booking Control Center */}
          <div className="lg:col-span-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {product.brand_name && (
                      <Link
                        href={`/rentals?brand=${product.brand ?? ""}`}
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
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {!isInStock
                      ? "Currently Unavailable"
                      : product.has_machine_numbers
                      ? `${stockCount} machines in depot`
                      : `${stockCount} units in depot`}
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
                      document
                        .getElementById("rental-details-tabs")
                        ?.scrollIntoView({ behavior: "smooth" });
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
                      ({ratingStats.count}{" "}
                      {ratingStats.count === 1 ? "review" : "reviews"})
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

              {/* Machine Number vs Bulk Stock Tracking Banner */}
              {product.has_machine_numbers ? (
                <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-950">
                  <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                  <div>
                    <p className="font-bold">
                      Individual Machine-Numbered Asset Tracking
                    </p>
                    <p className="mt-0.5 text-indigo-900/90">
                      Each machine carries a unique fleet ID (e.g., <span className="font-mono font-bold">RFP-0001</span>). Available machine numbers are automatically assigned to your booking for your selected dates.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800">
                  <Layers className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                  <div>
                    <p className="font-bold">
                      Bulk Stock Rental (No Machine Numbers)
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      Tracked by bulk stock quantity only — ideal for multi-unit orders such as 20+ scaffolding clamps or site accessories.
                    </p>
                  </div>
                </div>
              )}

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
                      const addRent =
                        parseFloat(variant.additional_rental_price || "0") || 0;
                      const vStock = variant.available_stock ?? variant.stock;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`rounded-lg border px-3.5 py-2 text-left text-xs font-bold transition-all ${
                            active
                              ? "border-[#EA580C] bg-orange-50 text-orange-950 ring-2 ring-orange-400/30"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <div>{variant.value}</div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {addRent === 0
                              ? "Standard Rate"
                              : `+${formatLKR(addRent, false)}/day`}
                            {" • "}
                            {vStock} ready
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rental Rate & Booking Configurator */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold text-[#EA580C]">
                      {formatLKR(dailyRental)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      / day
                    </span>
                    {discountPct > 0 && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatLKR(baseDaily)}
                      </span>
                    )}
                  </div>
                  <span className="rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-[#EA580C]">
                    Min 1 Day &bull; 10x Deposit
                  </span>
                </div>

                {/* Date Range & Quantity Picker */}
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
                      Quantity Needed
                    </label>
                    <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => setRentQty((q) => Math.max(1, q - 1))}
                        aria-label="Decrease rental quantity"
                        className="p-1 text-slate-700"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxSelectableQty}
                        value={rentQty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isNaN(v)) {
                            setRentQty(Math.max(1, Math.min(maxSelectableQty, v)));
                          }
                        }}
                        aria-label="Rental quantity"
                        className="w-12 bg-transparent text-center text-xs font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRentQty((q) => Math.min(maxSelectableQty, q + 1))
                        }
                        aria-label="Increase rental quantity"
                        className="p-1 text-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Fleet & Machine Number Availability Banner */}
                {endDate < startDate ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    End date cannot precede start date.
                  </div>
                ) : !isAuthenticated ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                    <span className="font-medium">
                      Sign in to verify live date-range availability
                      {product.has_machine_numbers
                        ? " & preview available machine numbers"
                        : ""}{" "}
                      ({stockCount} total in depot).
                    </span>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(
                        `/rentals/${product.id}`
                      )}`}
                      className="shrink-0 font-bold text-[#EA580C] underline"
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
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Available for Selected Dates ({effectiveAvailQty}{" "}
                      {availability?.has_machine_numbers ? "machines" : "units"} ready)
                    </div>
                    {availability?.has_machine_numbers &&
                      availability.available_machines.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-emerald-800">
                            Available Machine Numbers:
                          </span>
                          {availability.available_machines.map((m) => (
                            <span
                              key={m.id}
                              className="rounded border border-emerald-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-900"
                            >
                              {m.machine_number}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                ) : effectiveAvailQty !== null ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Only {effectiveAvailQty} unit(s) available for these dates. Please reduce quantity or adjust dates.
                  </div>
                ) : null}

                {/* 10x Deposit Breakdown */}
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
                    <span>
                      Rental Fee ({rentQty} unit{rentQty > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatLKR(rentalBreakdown.rentalSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      Refundable Deposit ({DEPOSIT_MULTIPLIER}x Daily Rate &ndash;
                      100% Refundable)
                    </span>
                    <span className="font-bold text-slate-950">
                      {formatLKR(rentalBreakdown.securityDeposit)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-950">
                    <span>Total Estimated Due</span>
                    <span>{formatLKR(rentalBreakdown.totalPayable)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span>
                    The security deposit of{" "}
                    <strong>{formatLKR(rentalBreakdown.securityDeposit)}</strong>{" "}
                    is fully refunded upon safe return and inspection of the equipment.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddAndProceed(true)}
                    disabled={
                      !isInStock ||
                      endDate < startDate ||
                      (isAuthenticated &&
                        effectiveAvailQty !== null &&
                        effectiveAvailQty < rentQty)
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-orange-700 transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Reserve Now
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddAndProceed(false)}
                    disabled={
                      !isInStock ||
                      endDate < startDate ||
                      (isAuthenticated &&
                        effectiveAvailQty !== null &&
                        effectiveAvailQty < rentQty)
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#EA580C] bg-white py-3.5 px-4 text-sm font-extrabold text-[#EA580C] hover:bg-orange-50 transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Multi-Item Rental
                  </button>
                </div>

                {draftCount > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs">
                    <span className="font-bold text-orange-950">
                      {draftCount} item{draftCount > 1 ? "s" : ""} currently in your rental booking list
                    </span>
                    <Link
                      href="/rental-checkout"
                      className="inline-flex items-center gap-1 font-extrabold text-[#EA580C] hover:underline"
                    >
                      Proceed to Rental Checkout
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Details Tabs */}
        <section
          id="rental-details-tabs"
          className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
        >
          <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
            {[
              {
                id: "specs",
                label: `Technical Specifications (${product.specifications.length})`,
              },
              { id: "description", label: "Description & Applications" },
              { id: "policy", label: "Deposit & Machine Tracking Policy" },
              { id: "reviews", label: `Renter Reviews (${ratingStats.count})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setInfoTab(
                    tab.id as "specs" | "description" | "policy" | "reviews"
                  )
                }
                className={`rounded-t-lg px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                  infoTab === tab.id
                    ? "border-[#EA580C] bg-white text-slate-950"
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
                    Detailed specifications are listed in the equipment description.
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
                  Maintained by Universal Tool Depot&apos;s Colombo 03 service bay and inspected before every dispatch to construction sites islandwide.
                </p>
              </div>
            )}

            {infoTab === "policy" && (
              <div className="space-y-4 text-sm text-slate-700">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5">
                  <p className="font-bold text-amber-950">
                    Equipment Rental Inspection &amp; 10x Deposit Policy
                  </p>
                  <p className="text-amber-900">
                    Rentals include a 100% refundable 10x security deposit (
                    {formatLKR(dailyRental * 10)} per unit) held while the equipment is on site.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                  <p className="font-bold text-slate-900">
                    {product.has_machine_numbers
                      ? "Machine-Numbered Unit Assignment"
                      : "Bulk Stock Quantity Tracking"}
                  </p>
                  <p className="text-slate-600">
                    {product.has_machine_numbers
                      ? "Specific alphanumeric machine numbers (e.g., RFP-0001) are automatically reserved when you confirm your booking so your site supervisor can verify exact serials upon delivery."
                      : "Bulk consumables and hardware accessories are tracked by aggregate depot quantity without per-unit machine numbers."}
                  </p>
                </div>
              </div>
            )}

            {infoTab === "reviews" && (
              <div id="reviews" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                          Based on {ratingStats.count} verified rental reviews
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
                                className="h-full bg-[#EA580C]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-slate-500">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Write a Rental Review
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
                          placeholder="Share fleet reliability & site performance..."
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="w-full rounded-lg bg-[#EA580C] py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          {reviewSubmitting ? "Submitting..." : "Submit Rental Review"}
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-600">
                        <Link
                          href="/login"
                          className="font-bold text-[#EA580C] underline"
                        >
                          Sign in
                        </Link>{" "}
                        to rate and review this rental equipment.
                      </p>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-3">
                  {reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No reviews yet for this rental machine.
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

        {/* Related Rental Fleet */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Related Rental Equipment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-[#EA580C] transition-all"
                >
                  <Link href={`/rentals/${rel.id}`} className="block space-y-2">
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
                    <p className="text-sm font-extrabold text-[#EA580C]">
                      {formatLKR(getEffectiveRentalPrice(rel), false)} / day
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
