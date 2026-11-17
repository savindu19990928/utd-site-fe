"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, MapPin, Truck, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Rental, RentalStatus } from "@/lib/types";

export default function AdminRentalsPage() {
  const { showToast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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
        err instanceof ApiError ? err.message : "Could not transition rental status.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Equipment Rental Operations
        </h1>
        <p className="text-sm text-slate-600">
          Confirm reservations, dispatch machinery to job sites, and release 10x refundable security deposits on return.
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
                        {formatDateDisplay(r.start_date)} &rarr; {formatDateDisplay(r.end_date)}
                      </strong>{" "}
                      &bull; Customer #{r.customer} &bull; {r.customer_mobile || "No mobile"}
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
                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                    <p className="font-bold uppercase text-slate-500">Equipment Units</p>
                    {r.items.map((item) => (
                      <p key={item.id} className="font-semibold text-slate-900">
                        {item.product_name} ({item.sku}) &times; {item.quantity} &mdash;{" "}
                        {item.rental_days} days
                      </p>
                    ))}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
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

                {/* Status Transition Actions (§7.11) */}
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
    </div>
  );
}
