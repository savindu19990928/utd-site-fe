"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  Layers,
  MapPin,
  SlidersHorizontal,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Rental, RentalItem, RentalStatus } from "@/lib/types";

interface ReassignModalState {
  rental: Rental;
  item: RentalItem;
  availableOptions: string[];
  selectedNumbers: string[];
  manualInput: string;
  loadingOptions: boolean;
  saving: boolean;
}

export default function AdminRentalsPage() {
  const { showToast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reassign, setReassign] = useState<ReassignModalState | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listRentals()
      .then((list) => {
        if (active) setRentals(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setRentals([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const transition = async (
    rental: Rental,
    nextStatus: Exclude<RentalStatus, "PENDING">
  ) => {
    setBusyId(rental.id);
    try {
      const updated = await api.updateRentalStatus(rental.id, nextStatus);
      setRentals((prev) =>
        prev.map((r) => (r.id === rental.id ? { ...r, status: updated.status } : r))
      );
      showToast(`Rental ${rental.reference} transitioned to ${nextStatus}.`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Could not transition rental status.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const openReassignModal = async (rental: Rental, item: RentalItem) => {
    const currentNums =
      item.machine_numbers?.length > 0
        ? item.machine_numbers
        : (item.assigned_machines ?? []).map((m) => m.machine_number);

    setReassign({
      rental,
      item,
      availableOptions: [...currentNums],
      selectedNumbers: [...currentNums],
      manualInput: currentNums.join(", "),
      loadingOptions: Boolean(item.rental_product),
      saving: false,
    });

    if (item.rental_product) {
      try {
        const avail = await api.checkRentalAvailability({
          rental_product_id: item.rental_product,
          rental_variant_id: item.rental_variant,
          start_date: rental.start_date,
          end_date: rental.end_date,
        });
        const merged = [
          ...new Set([
            ...currentNums,
            ...(avail.available_machines ?? []).map((m) => m.machine_number),
          ]),
        ];
        setReassign((prev) =>
          prev && prev.item.id === item.id
            ? { ...prev, availableOptions: merged, loadingOptions: false }
            : prev
        );
      } catch {
        setReassign((prev) =>
          prev && prev.item.id === item.id
            ? { ...prev, loadingOptions: false }
            : prev
        );
      }
    }
  };

  const toggleMachineChoice = (num: string) => {
    setReassign((prev) => {
      if (!prev) return null;
      const exists = prev.selectedNumbers.includes(num);
      let next: string[];
      if (exists) {
        next = prev.selectedNumbers.filter((n) => n !== num);
      } else {
        if (prev.selectedNumbers.length >= prev.item.quantity) {
          showToast(
            `Select exactly ${prev.item.quantity} machine number(s). Deselect one first.`,
            "warning"
          );
          return prev;
        }
        next = [...prev.selectedNumbers, num];
      }
      return {
        ...prev,
        selectedNumbers: next,
        manualInput: next.join(", "),
      };
    });
  };

  const handleSaveReassign = async () => {
    if (!reassign) return;
    const nums = [
      ...new Set(
        reassign.manualInput
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ];
    if (nums.length !== reassign.item.quantity) {
      showToast(
        `Please specify exactly ${reassign.item.quantity} machine number(s).`,
        "warning"
      );
      return;
    }

    setReassign((prev) => (prev ? { ...prev, saving: true } : null));
    try {
      const updated = await api.assignRentalMachines(reassign.rental.id, {
        rental_item_id: reassign.item.id,
        machine_numbers: nums,
      });
      setRentals((prev) =>
        prev.map((r) =>
          r.id === reassign.rental.id ? { ...r, ...updated } : r
        )
      );
      showToast(
        `Updated assigned machines for ${reassign.rental.reference}.`,
        "success"
      );
      setReassign(null);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not reassign machines.",
        "error"
      );
      setReassign((prev) => (prev ? { ...prev, saving: false } : null));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Equipment Rental Bookings &amp; Machine Dispatch
        </h1>
        <p className="text-sm text-slate-600">
          Confirm reservations, reassign machine numbers prior to dispatch, and release 10x refundable security deposits on return.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading rental fleet bookings...
          </div>
        ) : rentals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No rental bookings found.
          </div>
        ) : (
          rentals.map((r) => {
            const mapsHref = getMapsHref(r.tagged_location);
            const canReassign = r.status === "PENDING" || r.status === "CONFIRMED";
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-base font-extrabold text-slate-950">
                        {r.reference}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getOrderStatusBadgeClasses(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Schedule:{" "}
                      <strong className="text-slate-800">
                        {formatDateDisplay(r.start_date)} &rarr;{" "}
                        {formatDateDisplay(r.end_date)}
                      </strong>{" "}
                      &bull; Customer #{r.customer} &bull;{" "}
                      {r.customer_mobile || "No mobile"}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <p className="text-base font-extrabold text-slate-950">
                      {formatLKR(r.final_amount)}
                    </p>
                    <p className="font-semibold text-amber-800">
                      Deposit: {formatLKR(r.security_deposit)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3.5 space-y-2.5">
                    <p className="font-bold uppercase text-slate-500">
                      Equipment Units &amp; Machine Numbers
                    </p>
                    {r.items.map((item) => {
                      const machineNums =
                        item.machine_numbers?.length > 0
                          ? item.machine_numbers
                          : (item.assigned_machines ?? []).map(
                              (m) => m.machine_number
                            );
                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {item.product_name} ({item.sku}) &times; {item.quantity}{" "}
                              &mdash; {item.rental_days}d
                            </p>
                            {canReassign && item.has_machine_numbers && (
                              <button
                                type="button"
                                onClick={() => void openReassignModal(r, item)}
                                className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 shrink-0"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                                Reassign Machines
                              </button>
                            )}
                          </div>
                          {item.has_machine_numbers ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <Cpu className="h-3 w-3 text-indigo-700 mr-0.5" />
                              {machineNums.length > 0 ? (
                                machineNums.map((num) => (
                                  <span
                                    key={num}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-900"
                                  >
                                    {num}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  No machines assigned
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              <Layers className="h-3 w-3" />
                              Bulk Stock (No Machine #)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
                    <p className="font-bold uppercase text-slate-500">Site Dispatch</p>
                    <p className="text-slate-800">
                      {r.house_number ? `Plot/Gate ${r.house_number}, ` : ""}
                      {r.delivery_street}, {r.delivery_city}
                    </p>
                    {mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#EA580C] hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Open Site GPS Pin
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Status Transition Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {r.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void transition(r, "CONFIRMED")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm Booking
                    </button>
                  )}
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void transition(r, "ACTIVE")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA580C] px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Dispatch Equipment (Active)
                    </button>
                  )}
                  {r.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void transition(r, "COMPLETED")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Returned &amp; Release Deposit
                    </button>
                  )}
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void transition(r, "CANCELLED")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Rental
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reassign Machine Numbers Modal */}
      {reassign && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Reassign Machine Numbers
                </h2>
                <p className="text-xs text-slate-500">
                  {reassign.rental.reference} &bull; {reassign.item.product_name} (Select{" "}
                  <strong>{reassign.item.quantity}</strong> unit
                  {reassign.item.quantity > 1 ? "s" : ""})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassign(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reassign.loadingOptions ? (
              <p className="text-xs text-slate-500">
                Loading available machine numbers for {reassign.rental.start_date} to{" "}
                {reassign.rental.end_date}...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Available / Assigned Machines for Dates:
                </p>
                <div className="flex flex-wrap gap-2">
                  {reassign.availableOptions.map((num) => {
                    const checked = reassign.selectedNumbers.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => toggleMachineChoice(num)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                          checked
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-indigo-400"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Machine Numbers (comma separated, must match qty {reassign.item.quantity})
              </label>
              <input
                type="text"
                value={reassign.manualInput}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = val
                    .split(/[\n,;]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setReassign((prev) =>
                    prev
                      ? { ...prev, manualInput: val, selectedNumbers: parsed }
                      : null
                  );
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassign(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reassign.saving}
                onClick={() => void handleSaveReassign()}
                className="rounded-lg bg-indigo-700 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                {reassign.saving ? "Saving..." : "Save Assigned Machines"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
