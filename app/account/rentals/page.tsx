"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Rental } from "@/lib/types";

const RENTAL_STEPS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ACTIVE", label: "Active (On Site)" },
  { key: "COMPLETED", label: "Returned & Inspected" },
];

export default function RentalsHistoryPage() {
  const { showToast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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

  const handleCancel = async (rental: Rental) => {
    setCancellingId(rental.id);
    try {
      const updated = await api.cancelRental(rental.id);
      setRentals((prev) =>
        prev.map((r) => (r.id === rental.id ? { ...r, status: updated.status || "CANCELLED" } : r))
      );
      showToast(`Rental ${rental.reference} cancelled.`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not cancel rental.",
        "error"
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Rental Bookings Tracker
          </h1>
          <p className="text-sm text-slate-500">
            Track live equipment dispatch, active site durations, and 10x deposit refunds.
          </p>
        </div>
        <Link
          href="/rentals"
          className="rounded-xl bg-[#EA580C] px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700"
        >
          + Book New Equipment
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading rental reservations...
        </div>
      ) : rentals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-base font-bold text-slate-900">No rental bookings yet</p>
          <Link
            href="/rentals"
            className="mt-4 inline-block rounded-lg bg-[#EA580C] px-5 py-2.5 text-xs font-bold text-white"
          >
            Browse Rental Fleet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const stepIdx = RENTAL_STEPS.findIndex((s) => s.key === rental.status);
            const depositRefunded =
              rental.status === "COMPLETED" || rental.status === "CANCELLED";

            return (
              <div
                key={rental.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="font-mono text-base font-extrabold text-slate-950">
                      {rental.reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      Period:{" "}
                      <strong className="text-slate-800">
                        {formatDateDisplay(rental.start_date)} &rarr;{" "}
                        {formatDateDisplay(rental.end_date)}
                      </strong>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        depositRefunded
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      {depositRefunded
                        ? `Deposit Refunded (${formatLKR(rental.security_deposit)})`
                        : `Deposit Held (${formatLKR(rental.security_deposit)})`}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClasses(
                        rental.status
                      )}`}
                    >
                      {rental.status}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Stepper */}
                {rental.status !== "CANCELLED" && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {RENTAL_STEPS.map((st, idx) => {
                      const done = stepIdx >= idx;
                      return (
                        <div key={st.key} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              done ? "bg-[#EA580C]" : "bg-slate-200"
                            }`}
                          />
                          <p
                            className={`text-[10px] font-bold ${
                              done ? "text-[#EA580C]" : "text-slate-400"
                            }`}
                          >
                            {st.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <div className="text-slate-600">
                    {rental.items
                      .map((i) => `${i.product_name || "Equipment"} ×${i.quantity}`)
                      .join(", ")}{" "}
                    &bull; Total: <strong className="text-slate-950">{formatLKR(rental.final_amount)}</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {rental.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={cancellingId === rental.id}
                        onClick={() => void handleCancel(rental)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {cancellingId === rental.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                    <Link
                      href={`/account/rentals/${encodeURIComponent(rental.reference)}`}
                      className="inline-flex items-center gap-1 font-bold text-[#EA580C] hover:underline"
                    >
                      View Snapshot
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
