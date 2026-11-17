"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Printer } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Rental } from "@/lib/types";

export default function RentalSnapshotPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(params.reference || "");
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listRentals()
      .then((list) => {
        const match = list.find(
          (r) => r.reference === reference || String(r.id) === reference
        );
        setRental(match ?? null);
      })
      .catch(() => setRental(null))
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading rental snapshot...
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
        <p className="font-bold text-slate-900">Rental {reference} not found.</p>
        <Link href="/account/rentals" className="text-sm font-bold text-[#EA580C] underline">
          Back to Rentals
        </Link>
      </div>
    );
  }

  const mapsLink = getMapsHref(rental.tagged_location);
  const depositRefunded =
    rental.status === "COMPLETED" || rental.status === "CANCELLED";

  return (
    <div className="space-y-5 print-container">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/account/rentals"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rental Bookings
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          Print Rental Receipt
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rental Dispatch &amp; Deposit Snapshot
            </p>
            <h1 className="font-mono text-2xl font-extrabold text-slate-950">
              {rental.reference}
            </h1>
            <p className="text-xs text-slate-500">
              Dates: {formatDateDisplay(rental.start_date)} to{" "}
              {formatDateDisplay(rental.end_date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                depositRefunded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {depositRefunded ? "Deposit Refunded" : "Deposit Held"}:{" "}
              {formatLKR(rental.security_deposit)}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <p className="font-bold uppercase text-slate-500">Job-Site Location</p>
            <p className="font-semibold text-slate-900">
              {rental.house_number ? `Plot/Gate ${rental.house_number}, ` : ""}
              {rental.delivery_street}
            </p>
            <p className="text-slate-600">
              {rental.delivery_city}, {rental.delivery_state} {rental.delivery_zip_code}
            </p>
            {rental.customer_mobile && <p>Mobile: {rental.customer_mobile}</p>}
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#EA580C] hover:underline no-print"
              >
                <MapPin className="h-3.5 w-3.5" />
                Open Site Pin
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <p className="font-bold uppercase text-slate-500">Return Inspection Status</p>
            <p className="font-semibold text-slate-900">
              {rental.status === "COMPLETED"
                ? "Equipment returned & passed depot inspection. Deposit released."
                : rental.status === "ACTIVE"
                ? "Equipment currently deployed on job site."
                : rental.status === "CANCELLED"
                ? "Reservation cancelled; inventory & deposit released."
                : "Awaiting depot dispatch / confirmation."}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-center">Days</th>
                <th className="px-4 py-3 text-right">Daily Rate</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rental.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {item.sku} {item.variant_name ? `• ${item.variant_name}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-center">{item.rental_days}</td>
                  <td className="px-4 py-3 text-right">
                    {formatLKR(item.daily_rental_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatLKR(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Rental Fee</span>
              <span>{formatLKR(rental.subtotal)}</span>
            </div>
            <div className="flex justify-between text-amber-800 font-semibold">
              <span>Security Deposit (10x)</span>
              <span>{formatLKR(rental.security_deposit)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-950">
              <span>Total Paid / Due</span>
              <span>{formatLKR(rental.final_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
