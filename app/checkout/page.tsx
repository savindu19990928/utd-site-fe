"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  Plus,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import { formatLKR } from "@/lib/format";
import type { Address, Coupon, PaymentMethod } from "@/lib/types";
import { addressSchema, isValidLocationTag, SRI_LANKA_MOBILE_REGEX } from "@/lib/validation";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
  const { cartItems, cartSubtotal, refreshCart } = useStore();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const [newAddress, setNewAddress] = useState({
    title: "Site / Delivery Address",
    address_line_1: "",
    address_line_2: "",
    city: "Colombo",
    state: "Western",
    postal_code: "00300",
    is_default: false,
  });
  const [houseNumber, setHouseNumber] = useState("");
  const [locationTag, setLocationTag] = useState("6.927100, 79.861200");
  const [contactMobile, setContactMobile] = useState(() => user?.mobile_number || "");

  // Coupons
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KOKO");
  const [bankSlipName, setBankSlipName] = useState("");
  const [bankRefNote, setBankRefNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    api
      .listAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.is_default) || list[0];
          setSelectedAddressId(def.id);
        } else {
          setShowNewAddress(true);
        }
      })
      .catch(() => {});

    api
      .listCoupons()
      .then((list) => setAvailableCoupons(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, [isAuthenticated]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const val = parseFloat(appliedCoupon.discount_value) || 0;
    if (appliedCoupon.discount_type === "PERCENTAGE") {
      return Math.min(cartSubtotal, Math.round((cartSubtotal * val) / 100 * 100) / 100);
    }
    return Math.min(cartSubtotal, val);
  }, [appliedCoupon, cartSubtotal]);

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleCreateAddress = async () => {
    const parsed = addressSchema.safeParse(newAddress);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Invalid address fields.", "error");
      return;
    }
    try {
      const created = await api.createAddress(parsed.data);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      showToast("Delivery address saved.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not save address.",
        "error"
      );
    }
  };

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    const found = availableCoupons.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponError("Coupon code is invalid or expired.");
      return;
    }
    const now = Date.now();
    if (found.start_date && new Date(found.start_date).getTime() > now) {
      setCouponError("This coupon campaign has not started yet.");
      return;
    }
    if (found.end_date && new Date(found.end_date).getTime() < now) {
      setCouponError("This coupon code has expired.");
      return;
    }
    const minSpend = parseFloat(found.min_purchase_amount ?? "0") || 0;
    if (cartSubtotal < minSpend) {
      setCouponError(`Minimum spend of ${formatLKR(minSpend, false)} required.`);
      return;
    }
    setAppliedCoupon(found);
    showToast(`Coupon ${found.code} applied!`, "success");
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty.", "warning");
      return;
    }

    const mobileClean = contactMobile.replace(/\s+/g, "");
    if (!mobileClean || !SRI_LANKA_MOBILE_REGEX.test(mobileClean)) {
      showToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (locationTag.trim() && !isValidLocationTag(locationTag)) {
      showToast("Please provide a valid map link or coordinates.", "error");
      return;
    }

    let addressIdToUse = selectedAddressId;
    if (!addressIdToUse && showNewAddress) {
      const parsed = addressSchema.safeParse(newAddress);
      if (!parsed.success) {
        showToast(parsed.error.issues[0]?.message || "Please complete delivery address.", "error");
        return;
      }
      try {
        const created = await api.createAddress(parsed.data);
        addressIdToUse = created.id;
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Failed to save address.", "error");
        return;
      }
    }

    if (!addressIdToUse) {
      showToast("Please select or add a delivery address.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Save mobile number onto user profile if changed
      if (user && user.mobile_number !== mobileClean) {
        await api.updateProfile({ mobile_number: mobileClean }).catch(() => {});
        await refreshProfile();
      }

      const order = await api.checkout({
        address_id: addressIdToUse,
        ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
      });

      const payment = await api.initiatePayment(order.id, paymentMethod);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `utd_order_${order.order_number}`,
          JSON.stringify({
            order,
            payment,
            houseNumber,
            locationTag,
            bankSlipName,
            bankRefNote,
          })
        );
      }

      await refreshCart();
      showToast(`Order ${order.order_number} placed!`, "success");
      router.push(
        `/order-confirmation/${encodeURIComponent(order.order_number)}?id=${order.id}&paymentId=${payment.id}`
      );
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Checkout failed. Please review your cart and try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
        Verifying your session...
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
            Checkout &amp; Job-Site Delivery
          </h1>
          <p className="text-sm text-slate-600">
            Select your saved delivery site, pin exact GPS coordinates, and choose your preferred Sri Lankan payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Address + Site Pin + Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Delivery Address */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#F5A623]" />
                  1. Delivery Address &amp; Site Pin
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewAddress((s) => !s)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showNewAddress ? "Choose Saved" : "Add New Address"}
                </button>
              </div>

              {!showNewAddress && addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        selectedAddressId === addr.id
                          ? "border-[#F5A623] bg-amber-50/70 ring-2 ring-amber-400/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="delivery_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#F5A623]"
                        />
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {addr.title}
                            </span>
                            {addr.is_default && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700">{addr.address_line_1}</p>
                          {addr.address_line_2 && (
                            <p className="text-slate-600">{addr.address_line_2}</p>
                          )}
                          <p className="text-slate-500">
                            {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {showNewAddress && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Address Title *
                      </label>
                      <input
                        type="text"
                        value={newAddress.title}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, title: e.target.value })
                        }
                        placeholder="Home / Site A"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={newAddress.postal_code}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, postal_code: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={newAddress.address_line_1}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, address_line_1: e.target.value })
                      }
                      placeholder="123 Galle Road"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Line 2
                      </label>
                      <input
                        type="text"
                        value={newAddress.address_line_2}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, address_line_2: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Province *
                      </label>
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCreateAddress()}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Save Delivery Address
                  </button>
                </div>
              )}

              {/* Site Gate / Plot, Contact Mobile, GPS Location Tagger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    House / Plot / Gate Number
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. Plot 14 / Gate B"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F5A623] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Contact Mobile (07XXXXXXXX) *
                  </label>
                  <input
                    type="tel"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    placeholder="0771234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F5A623] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagged Location (GPS Coordinates or Google Maps Link)
                </label>
                <input
                  type="text"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  placeholder="6.927100, 79.861200 or https://maps.google.com/..."
                  className="mb-2.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-[#F5A623] focus:outline-none"
                />
                <LocationPicker value={locationTag} onChange={setLocationTag} heightClass="h-52" />
              </div>
            </section>

            {/* 2. Payment Method */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                2. Payment Method
              </h2>
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                totalAmount={finalTotal}
                bankSlipName={bankSlipName}
                onBankSlipChange={setBankSlipName}
                bankRefNote={bankRefNote}
                onBankRefNoteChange={setBankRefNote}
              />
            </section>
          </div>

          {/* Right Column: Order Summary + Coupon */}
          <aside className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 sticky top-28">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Order Summary
            </h2>

            {cartItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Your cart is empty.{" "}
                <Link href="/catalog" className="font-bold text-[#D97706] underline">
                  Browse Tools
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Qty {item.quantity} &times; {formatLKR(item.unitPrice, false)}
                      </p>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {formatLKR(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Coupon Code */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Tag className="h-3.5 w-3.5 text-[#F5A623]" />
                Promo / Contractor Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs uppercase focus:border-[#F5A623] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p className="text-xs font-semibold text-red-600">{couponError}</p>
              )}
              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {appliedCoupon.code} applied (-{formatLKR(discountAmount)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-emerald-700 hover:text-emerald-950"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <p className="text-[11px] text-slate-500">
                  Available codes:{" "}
                  {availableCoupons.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCouponInput(c.code)}
                      className="mr-2 font-mono font-bold text-[#D97706] hover:underline"
                    >
                      {c.code}
                    </button>
                  ))}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatLKR(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{formatLKR(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-bold text-slate-900">Final Total</span>
                <span className="text-2xl font-extrabold text-slate-950">
                  {formatLKR(finalTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || cartItems.length === 0}
              onClick={() => void handlePlaceOrder()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-3.5 text-sm font-extrabold text-zinc-950 shadow-sm hover:bg-[#e09212] transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? "Processing Order..." : "Place Order & Pay"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
