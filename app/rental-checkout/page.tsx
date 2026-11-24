"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Layers,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
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
  getEffectiveStock,
  getProductPrimaryImage,
  toISODateInput,
} from "@/lib/format";
import type {
  Address,
  RentalAvailabilityResponse,
  RentalProduct,
} from "@/lib/types";
import { rentalDispatchSchema } from "@/lib/validation";

interface CheckoutLineItem {
  key: string;
  rentalProductId: number;
  rentalVariantId: number | null;
  quantity: number;
}

export default function RentalCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    rentalProductsById,
    registerRentalProducts,
    rentalDraft,
    setRentalDraft,
  } = useStore();
  const { showToast } = useToast();

  const rentableProducts = useMemo(
    () => Object.values(rentalProductsById).filter((p) => p.is_available),
    [rentalProductsById]
  );

  const todayISO = useMemo(() => toISODateInput(new Date()), []);
  const defaultEndISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toISODateInput(d);
  }, []);

  const [startDate, setStartDate] = useState<string>(
    () => rentalDraft?.startDate || todayISO
  );
  const [endDate, setEndDate] = useState<string>(
    () => rentalDraft?.endDate || defaultEndISO
  );

  const [items, setItems] = useState<CheckoutLineItem[]>(() => {
    if (rentalDraft?.items && rentalDraft.items.length > 0) {
      return rentalDraft.items.map((it, idx) => ({
        key: `${it.rentalProductId}-${it.rentalVariantId ?? "base"}-${idx}`,
        rentalProductId: it.rentalProductId,
        rentalVariantId: it.rentalVariantId,
        quantity: it.quantity,
      }));
    }
    return [];
  });

  // Fetch rental products if store wasn't seeded yet
  useEffect(() => {
    if (rentableProducts.length === 0) {
      api
        .listRentalProducts()
        .then(registerRentalProducts)
        .catch(() => {});
    }
  }, [rentableProducts.length, registerRentalProducts]);

  // Seed default first item once rentableProducts arrive if items is empty
  useEffect(() => {
    if (items.length === 0 && rentableProducts.length > 0) {
      Promise.resolve().then(() => {
        setItems((prev) =>
          prev.length === 0
            ? [
                {
                  key: `${rentableProducts[0].id}-base-0`,
                  rentalProductId: rentableProducts[0].id,
                  rentalVariantId: null,
                  quantity: 1,
                },
              ]
            : prev
        );
      });
    }
  }, [items.length, rentableProducts]);

  // Per-item availability map keyed by line key
  const [availMap, setAvailMap] = useState<
    Record<string, RentalAvailabilityResponse | null>
  >({});
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

  // Bank Transfer details
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

  const canCheckAvailability = Boolean(
    isAuthenticated &&
      items.length > 0 &&
      startDate &&
      endDate &&
      endDate >= startDate
  );

  useEffect(() => {
    if (!canCheckAvailability) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setAvailLoading(true);
    });

    Promise.all(
      items.map(async (it) => {
        try {
          const res = await api.checkRentalAvailability({
            rental_product_id: it.rentalProductId,
            rental_variant_id: it.rentalVariantId,
            start_date: startDate,
            end_date: endDate,
          });
          return [it.key, res] as const;
        } catch {
          return [it.key, null] as const;
        }
      })
    )
      .then((entries) => {
        if (!cancelled) {
          setAvailMap(Object.fromEntries(entries));
        }
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canCheckAvailability, items, startDate, endDate]);

  const days = countRentalDays(startDate, endDate);

  const lineBreakdowns = useMemo(() => {
    return items.map((it) => {
      const rp: RentalProduct | undefined =
        rentalProductsById[it.rentalProductId];
      const activeVariants = (rp?.variants ?? []).filter((v) => v.is_active);
      const variant =
        activeVariants.find((v) => v.id === it.rentalVariantId) ?? null;
      const dailyPrice = rp ? getEffectiveRentalPrice(rp, variant) : 0;
      const calc = calculateRentalBreakdown(
        dailyPrice,
        days,
        it.quantity,
        DEPOSIT_MULTIPLIER
      );
      const avail = availMap[it.key] ?? null;
      return {
        item: it,
        product: rp,
        variant,
        activeVariants,
        avail,
        ...calc,
      };
    });
  }, [items, rentalProductsById, days, availMap]);

  const totalRentalSubtotal = useMemo(
    () =>
      lineBreakdowns.reduce((sum, l) => sum + l.rentalSubtotal, 0),
    [lineBreakdowns]
  );

  const totalSecurityDeposit = useMemo(
    () =>
      lineBreakdowns.reduce((sum, l) => sum + l.securityDeposit, 0),
    [lineBreakdowns]
  );

  const grandTotalPayable =
    Math.round((totalRentalSubtotal + totalSecurityDeposit) * 100) / 100;

  const hasUnavailableItem = lineBreakdowns.some(
    (l) => l.avail !== null && l.avail.available_quantity < l.item.quantity
  );

  const handleAddItem = () => {
    if (rentableProducts.length === 0) return;
    const usedIds = new Set(items.map((i) => i.rentalProductId));
    const candidate =
      rentableProducts.find((p) => !usedIds.has(p.id)) || rentableProducts[0];
    setItems((prev) => [
      ...prev,
      {
        key: `${candidate.id}-base-${Date.now()}`,
        rentalProductId: candidate.id,
        rentalVariantId: null,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  };

  const handleUpdateItem = (
    key: string,
    patch: Partial<Pick<CheckoutLineItem, "rentalProductId" | "rentalVariantId" | "quantity">>
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it))
    );
  };

  const handleApplySavedAddress = (addr: Address) => {
    setStreet(addr.address_line_1);
    setCity(addr.city);
    setProvince(addr.state);
    setZipCode(addr.postal_code);
  };

  const handleSubmitRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (items.length === 0) {
      showToast("Please add at least one piece of equipment to rent.", "warning");
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      showToast("End date cannot precede start date.", "error");
      return;
    }
    if (hasUnavailableItem) {
      showToast(
        "One or more items lack sufficient availability for these dates.",
        "error"
      );
      return;
    }
    if (!depositAccepted) {
      showToast(
        "Please acknowledge the 100% refundable security deposit terms.",
        "warning"
      );
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
      showToast(
        parsed.error.issues[0]?.message || "Check dispatch fields.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const rental = await api.createRental({
        start_date: startDate,
        end_date: endDate,
        items: items.map((it) => ({
          rental_product_id: it.rentalProductId,
          rental_variant_id: it.rentalVariantId,
          quantity: it.quantity,
        })),
        ...parsed.data,
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `utd_rental_${rental.reference}`,
          JSON.stringify({
            rental,
            paymentMethod: "BANK_TRANSFER",
            bankSlipName,
            bankRefNote,
          })
        );
      }
      setRentalDraft(null);
      showToast(`Rental ${rental.reference} booked successfully!`, "success");
      router.push(
        `/rental-confirmation/${encodeURIComponent(rental.reference)}?id=${rental.id}&method=BANK_TRANSFER`
      );
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Could not complete rental booking.",
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
              Multi-Item Equipment Rental Booking
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              Reserve Construction Equipment
            </h1>
          </div>
          <Link href="/rentals" className="text-xs font-bold text-[#EA580C] hover:underline">
            &larr; Browse Rental Fleet
          </Link>
        </div>

        <form
          onSubmit={handleSubmitRental}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Schedule & Multi-Item Fleet Selection */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Step 1: Rental Dates &amp; Equipment Items
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#EA580C] hover:bg-orange-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Another Rental Item
                </button>
              </div>

              {/* Shared Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Rental Items List */}
              <div className="space-y-4">
                {lineBreakdowns.map((line, index) => {
                  const it = line.item;
                  const rp = line.product;
                  const maxQty =
                    line.avail?.available_quantity ??
                    (rp ? getEffectiveStock(rp, line.variant) : 99);
                  const insufficient =
                    line.avail !== null && line.avail.available_quantity < it.quantity;

                  return (
                    <div
                      key={it.key}
                      className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
                            Item #{index + 1}
                          </span>
                          {rp &&
                            (rp.has_machine_numbers ? (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                                <Cpu className="h-3 w-3" />
                                Machine-Numbered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                <Layers className="h-3 w-3" />
                                Bulk Stock (No Machine #)
                              </span>
                            ))}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.key)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-9">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Equipment *
                          </label>
                          <select
                            value={it.rentalProductId}
                            onChange={(e) =>
                              handleUpdateItem(it.key, {
                                rentalProductId: Number(e.target.value),
                                rentalVariantId: null,
                                quantity: 1,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#EA580C] focus:outline-none"
                          >
                            {rentableProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) &mdash;{" "}
                                {formatLKR(getEffectiveRentalPrice(p), false)}/day{" "}
                                {p.has_machine_numbers ? "[Machine #]" : "[Bulk Stock]"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, maxQty)}
                            value={it.quantity}
                            onChange={(e) =>
                              handleUpdateItem(it.key, {
                                quantity: Math.max(
                                  1,
                                  parseInt(e.target.value, 10) || 1
                                ),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                          />
                        </div>
                      </div>

                      {line.activeVariants.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Option ({line.activeVariants[0].name})
                          </label>
                          <select
                            value={it.rentalVariantId ?? ""}
                            onChange={(e) =>
                              handleUpdateItem(it.key, {
                                rentalVariantId: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
                          >
                            <option value="">Standard</option>
                            {line.activeVariants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.value} ({v.available_stock ?? v.stock} ready)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Live availability & machine numbers */}
                      {availLoading ? (
                        <p className="text-xs text-slate-500">
                          Checking real-time availability...
                        </p>
                      ) : line.avail ? (
                        insufficient ? (
                          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Only {line.avail.available_quantity} unit(s) available for{" "}
                            {days} days.
                          </div>
                        ) : (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              Confirmed Available ({line.avail.available_quantity}{" "}
                              {line.avail.has_machine_numbers ? "machines" : "units"}{" "}
                              ready)
                            </div>
                            {line.avail.has_machine_numbers ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-medium text-emerald-800">
                                  Auto-assigned from available fleet:
                                </span>
                                {line.avail.available_machines.map((m) => (
                                  <span
                                    key={m.id}
                                    className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold"
                                  >
                                    {m.machine_number}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-emerald-800">
                                Bulk stock — no individual machine numbers assigned.
                              </p>
                            )}
                          </div>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
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
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.house_number}
                    </p>
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
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.customer_mobile}
                    </p>
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
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.delivery_street}
                    </p>
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
                  <p className="mb-2 text-xs text-red-600">
                    {fieldErrors.tagged_location}
                  </p>
                )}
                <LocationPicker
                  value={taggedLocation}
                  onChange={setTaggedLocation}
                  heightClass="h-52"
                />
              </div>
            </section>

            {/* Step 4: Direct Bank Transfer Only */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Step 4: Payment via Direct Bank Transfer
              </h2>
              <PaymentMethodSelector
                selected="BANK_TRANSFER"
                totalAmount={grandTotalPayable}
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

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {lineBreakdowns.map((line) => {
                const rp = line.product;
                const img = rp ? getProductPrimaryImage(rp) : null;
                return (
                  <div key={line.item.key} className="flex items-center gap-3 py-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-lg bg-slate-50 border border-slate-200">
                      {img && (
                        <Image
                          src={img}
                          alt={rp?.name || "Rental item"}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {rp?.name || `Rental Item #${line.item.rentalProductId}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {line.item.quantity} unit{line.item.quantity > 1 ? "s" : ""} &times;{" "}
                        {formatLKR(line.dailyPrice, false)}/day &times; {days} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900">
                        {formatLKR(line.rentalSubtotal, false)}
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold">
                        +{formatLKR(line.securityDeposit, false)} dep
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 text-sm border-t border-b border-slate-200 py-4">
              <div className="flex justify-between text-slate-600">
                <span>Rental Window</span>
                <span className="font-semibold text-slate-900">
                  {days} Days ({formatDateDisplay(startDate)} -{" "}
                  {formatDateDisplay(endDate)})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Combined Rental Fee</span>
                <span className="font-bold text-slate-900">
                  {formatLKR(totalRentalSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-amber-900 font-semibold">
                <span>Refundable Deposit (10x Rate)</span>
                <span className="font-extrabold">
                  {formatLKR(totalSecurityDeposit)}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900">
                Total Amount Due
              </span>
              <span className="text-2xl font-extrabold text-[#EA580C]">
                {formatLKR(grandTotalPayable)}
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
                I understand that the security deposit of{" "}
                <strong>{formatLKR(totalSecurityDeposit)}</strong> is held and
                fully refunded upon safe return of the undamaged equipment.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || items.length === 0 || hasUnavailableItem}
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
