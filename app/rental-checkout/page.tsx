"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { LocationPicker } from "@/components/maps/LocationPicker";
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
  getEffectiveRentalPrice,
  getProductPrimaryImage,
  toISODateInput,
} from "@/lib/format";
import type { Address, PaymentMethod, Product } from "@/lib/types";
import { rentalDispatchSchema } from "@/lib/validation";

export default function RentalCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { productsById, rentalDraft, setRentalDraft } = useStore();
  const { showToast } = useToast();

  const rentableProducts = useMemo(
    () => Object.values(productsById).filter((p) => p.is_for_rent && p.is_available),
    [productsById]
  );

  const todayISO = useMemo(() => toISODateInput(new Date()), []);
  const defaultEndISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toISODateInput(d);
  }, []);

  const [selectedProductId, setSelectedProductId] = useState<number>(
    rentalDraft?.productId ?? 0
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    rentalDraft?.variantId ?? null
  );
  const [quantity, setQuantity] = useState<number>(rentalDraft?.quantity ?? 1);
  const [startDate, setStartDate] = useState<string>(rentalDraft?.startDate || todayISO);
  const [endDate, setEndDate] = useState<string>(rentalDraft?.endDate || defaultEndISO);

  const [availQty, setAvailQty] = useState<number | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [depositAccepted, setDepositAccepted] = useState(false);

  // Site Delivery Details
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Colombo");
  const [province, setProvince] = useState("Western");
  const [zipCode, setZipCode] = useState("00300");
  const [houseNumber, setHouseNumber] = useState("");
  const [taggedLocation, setTaggedLocation] = useState("6.927100, 79.861200");
  const [mobile, setMobile] = useState(() => user?.mobile_number || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KOKO");
  const [bankSlipName, setBankSlipName] = useState("");
  const [bankRefNote, setBankRefNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/rental-checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .listAddresses()
      .then((list) => {
        setSavedAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) {
          setStreet((prev) => prev || def.address_line_1);
          setCity((prev) => prev || def.city);
          setProvince((prev) => prev || def.state);
          setZipCode((prev) => prev || def.postal_code);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const activeProductId = selectedProductId || rentableProducts[0]?.id || 0;
  const product: Product | undefined = productsById[activeProductId];
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.is_active),
    [product]
  );
  const variant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? null;

  const canCheckAvailability =
    Boolean(isAuthenticated && product && startDate && endDate && endDate >= startDate);

  useEffect(() => {
    if (!canCheckAvailability || !product) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setAvailLoading(true);
    });
    api
      .checkRentalAvailability({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        start_date: startDate,
        end_date: endDate,
      })
      .then((r) => {
        if (!cancelled) setAvailQty(r.available_quantity);
      })
      .catch(() => {
        if (!cancelled) setAvailQty(null);
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canCheckAvailability, product, variant, startDate, endDate]);

  const effectiveAvailQty = canCheckAvailability ? availQty : null;

  const dailyPrice = product ? getEffectiveRentalPrice(product, variant) : 0;
  const days = countRentalDays(startDate, endDate);
  const breakdown = calculateRentalBreakdown(
    dailyPrice,
    days,
    quantity,
    DEPOSIT_MULTIPLIER
  );

  const handleApplySavedAddress = (addr: Address) => {
    setStreet(addr.address_line_1);
    setCity(addr.city);
    setProvince(addr.state);
    setZipCode(addr.postal_code);
  };

  const handleSubmitRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!product) {
      showToast("Please select a piece of equipment to rent.", "warning");
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      showToast("End date cannot precede start date.", "error");
      return;
    }
    if (effectiveAvailQty !== null && effectiveAvailQty < quantity) {
      showToast("Equipment is fully booked for these dates.", "error");
      return;
    }
    if (!depositAccepted) {
      showToast("Please acknowledge the 100% refundable security deposit terms.", "warning");
      return;
    }

    const parsed = rentalDispatchSchema.safeParse({
      delivery_street: street,
      delivery_city: city,
      delivery_state: province,
      delivery_zip_code: zipCode,
      house_number: houseNumber,
      tagged_location: taggedLocation,
      customer_mobile: mobile,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showToast(parsed.error.issues[0]?.message || "Check dispatch fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const rental = await api.createRental({
        start_date: startDate,
        end_date: endDate,
        items: [
          {
            product_id: product.id,
            variant_id: variant?.id ?? null,
            quantity,
          },
        ],
        ...parsed.data,
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `utd_rental_${rental.reference}`,
          JSON.stringify({
            rental,
            paymentMethod,
            bankSlipName,
            bankRefNote,
          })
        );
      }
      setRentalDraft(null);
      showToast(`Rental ${rental.reference} booked successfully!`, "success");
      router.push(
        `/rental-confirmation/${encodeURIComponent(rental.reference)}?id=${rental.id}&method=${paymentMethod}`
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not complete rental booking.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
        Loading rental booking workspace...
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#EA580C] mb-2">
              <CalendarClock className="h-3.5 w-3.5" />
              4-Step Equipment Rental Booking
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              Reserve Construction Equipment
            </h1>
          </div>
          <Link href="/rentals" className="text-xs font-bold text-[#D97706] hover:underline">
            &larr; Change Equipment
          </Link>
        </div>

        <form onSubmit={handleSubmitRental} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Schedule & Fleet Selection */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Step 1: Rental Schedule &amp; Fleet Selection
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Equipment to Rent
                </label>
                <select
                  value={activeProductId}
                  onChange={(e) => {
                    setSelectedProductId(Number(e.target.value));
                    setSelectedVariantId(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:border-[#EA580C] focus:outline-none"
                >
                  {rentableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) &mdash; {formatLKR(getEffectiveRentalPrice(p), false)}/day
                    </option>
                  ))}
                </select>
              </div>

              {activeVariants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Option ({activeVariants[0].name})
                  </label>
                  <select
                    value={selectedVariantId ?? ""}
                    onChange={(e) =>
                      setSelectedVariantId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  >
                    <option value="">Standard</option>
                    {activeVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.value} ({v.stock} units)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date *
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    min={startDate || todayISO}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={effectiveAvailQty ?? product?.stock ?? 10}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>

              {availLoading ? (
                <p className="text-xs text-slate-500">Checking real-time fleet availability...</p>
              ) : effectiveAvailQty !== null && effectiveAvailQty >= quantity ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmed Available ({effectiveAvailQty} units ready for {days} days)
                </div>
              ) : effectiveAvailQty !== null ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  Equipment is fully booked for these dates. Only {effectiveAvailQty} available.
                </div>
              ) : null}
            </section>

            {/* Step 3: Delivery Job Site Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#EA580C]" />
                  Step 3: Job-Site Delivery Details
                </h2>
                {savedAddresses.length > 0 && (
                  <select
                    onChange={(e) => {
                      const found = savedAddresses.find(
                        (a) => a.id === Number(e.target.value)
                      );
                      if (found) handleApplySavedAddress(found);
                    }}
                    defaultValue=""
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="" disabled>
                      Auto-fill from Saved Address
                    </option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    House / Plot / Site Gate Number *
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Plot 42 / Gate B"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {fieldErrors.house_number && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.house_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Site Contact Mobile (07XXXXXXXX) *
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="0771234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {fieldErrors.customer_mobile && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.customer_mobile}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street / Site Road *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="45 Park Lane"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {fieldErrors.delivery_street && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.delivery_street}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Province / State *
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagged GPS Location or Google Maps Link
                </label>
                <input
                  type="text"
                  value={taggedLocation}
                  onChange={(e) => setTaggedLocation(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                />
                {fieldErrors.tagged_location && (
                  <p className="mb-2 text-xs text-red-600">{fieldErrors.tagged_location}</p>
                )}
                <LocationPicker value={taggedLocation} onChange={setTaggedLocation} heightClass="h-52" />
              </div>
            </section>

            {/* Step 4: Payment Gateway */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Step 4: Confirm &amp; Select Payment Method
              </h2>
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                totalAmount={breakdown.totalPayable}
                bankSlipName={bankSlipName}
                onBankSlipChange={setBankSlipName}
                bankRefNote={bankRefNote}
                onBankRefNoteChange={setBankRefNote}
              />
            </section>
          </div>

          {/* Right Summary: Step 2 Cost & 10x Security Deposit Summary */}
          <aside className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 sticky top-28">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Step 2: Cost &amp; Deposit Breakdown
            </h2>

            {product && (
              <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="relative h-16 w-16 shrink-0 rounded-lg bg-white border border-slate-200">
                  {getProductPrimaryImage(product) && (
                    <Image
                      src={getProductPrimaryImage(product)!}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500">
                    {variant?.sku || product.sku}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5 text-sm border-t border-b border-slate-200 py-4">
              <div className="flex justify-between text-slate-600">
                <span>Daily Rental Rate</span>
                <span className="font-semibold text-slate-900">
                  {formatLKR(dailyPrice)} / day
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rental Window</span>
                <span className="font-semibold text-slate-900">
                  {days} Days ({formatDateDisplay(startDate)} - {formatDateDisplay(endDate)})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rental Fee ({quantity} unit{quantity > 1 ? "s" : ""})</span>
                <span className="font-bold text-slate-900">
                  {formatLKR(breakdown.rentalSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-amber-900 font-semibold">
                <span>Refundable Deposit (10x Rate)</span>
                <span className="font-extrabold">
                  {formatLKR(breakdown.securityDeposit)}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900">Total Amount Due</span>
              <span className="text-2xl font-extrabold text-[#EA580C]">
                {formatLKR(breakdown.totalPayable)}
              </span>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={depositAccepted}
                onChange={(e) => setDepositAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#EA580C]"
              />
              <span>
                I understand that the deposit of{" "}
                <strong>{formatLKR(breakdown.securityDeposit)}</strong> is held and fully
                refunded upon safe return of the undamaged equipment.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !product || (effectiveAvailQty !== null && effectiveAvailQty < quantity)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? "Confirming Booking..." : "Confirm Rental & Proceed"}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
