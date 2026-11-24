"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Layers,
  MapPin,
  Printer,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Rental } from "@/lib/types";

export default function RentalConfirmationPage() {
  const params = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const reference = decodeURIComponent(params.reference || "");
  const idParam = searchParams.get("id");
  const methodParam = searchParams.get("method") || "BANK_TRANSFER";

  const [rental, setRental] = useState<Rental | null>(null);
  const [extras, setExtras] = useState<{
    bankSlipName?: string;
    bankRefNote?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(`utd_rental_${reference}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (mounted && parsed.rental) {
              setRental(parsed.rental);
              setExtras({
                bankSlipName: parsed.bankSlipName,
                bankRefNote: parsed.bankRefNote,
              });
            }
          } catch {
            // ignore
          }
        }
      }

      if (isAuthenticated) {
        try {
          if (idParam && /^\d+$/.test(idParam)) {
            const fresh = await api.getRental(Number(idParam));
            if (mounted) setRental(fresh);
          } else {
            const list = await api.listRentals();
            const found = list.find((r) => r.reference === reference);
            if (found && mounted) setRental(found);
          }
        } catch {
          // keep snapshot
        }
      }
      if (mounted) setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [reference, idParam, isAuthenticated]);

  if (loading && !rental) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">
        Loading rental confirmation...
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900">
          Rental reference {reference} not found.
        </p>
        <Link
          href="/account/rentals"
          className="inline-block rounded-lg bg-[#EA580C] px-5 py-2.5 text-sm font-bold text-white"
        >
          View My Rental Bookings
        </Link>
      </div>
    );
  }

  const mapsLink = getMapsHref(rental.tagged_location);

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 space-y-6 print-container">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950">
            Thank you! Your equipment rental is reserved.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Rental Reference:{" "}
            <span className="font-mono font-bold text-slate-950">
              {rental.reference}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClasses(
                rental.status
              )}`}
            >
              Status: {rental.status}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              Refundable Deposit Held: {formatLKR(rental.security_deposit)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Universal Tool Depot — Rental Dispatch Receipt
              </h2>
              <p className="text-xs text-slate-500">
                Created {formatDateTimeDisplay(rental.created_at)} &bull; Rental
                Period:{" "}
                <strong>
                  {formatDateDisplay(rental.start_date)} to{" "}
                  {formatDateDisplay(rental.end_date)}
                </strong>
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <p className="font-bold text-slate-950">{rental.reference}</p>
              <p className="text-slate-500">
                Method:{" "}
                {methodParam === "BANK_TRANSFER"
                  ? "Direct Bank Transfer"
                  : methodParam}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <p className="font-bold uppercase tracking-wider text-slate-500">
                Job-Site Dispatch Snapshot
              </p>
              <p className="font-semibold text-slate-900">
                {rental.house_number ? `Gate/Plot ${rental.house_number}, ` : ""}
                {rental.delivery_street}
              </p>
              <p className="text-slate-700">
                {rental.delivery_city}, {rental.delivery_state}{" "}
                {rental.delivery_zip_code}
              </p>
              {rental.customer_mobile && (
                <p className="text-slate-600">Site Mobile: {rental.customer_mobile}</p>
              )}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-bold text-[#EA580C] hover:underline no-print"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  View Site Pin
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5 text-amber-950">
              <p className="font-bold uppercase tracking-wider">
                Direct Bank Transfer &amp; 10x Deposit
              </p>
              <p className="font-bold text-slate-900">
                Commercial Bank of Ceylon &bull; A/C 1000 8923 4510
              </p>
              <p>
                Transfer{" "}
                <strong>{formatLKR(rental.final_amount)}</strong> quoting{" "}
                <strong className="font-mono">{rental.reference}</strong>. Your
                10x deposit of{" "}
                <strong>{formatLKR(rental.security_deposit)}</strong> is
                refunded immediately upon safe return inspection.
              </p>
              {extras.bankRefNote && (
                <p className="font-semibold">Ref Note: {extras.bankRefNote}</p>
              )}
              {extras.bankSlipName && (
                <p className="font-semibold text-emerald-800">
                  Slip attached: {extras.bankSlipName}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Equipment &amp; Assigned Machine #</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Days</th>
                  <th className="px-4 py-3 text-right">Daily Rate</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rental.items.map((item) => {
                  const machineNums =
                    item.machine_numbers?.length > 0
                      ? item.machine_numbers
                      : (item.assigned_machines ?? []).map(
                          (m) => m.machine_number
                        );
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">
                          {item.product_name ||
                            `Rental Equipment #${item.rental_product ?? item.id}`}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {item.sku}{" "}
                          {item.variant_name ? `• ${item.variant_name}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {item.has_machine_numbers ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-800">
                                <Cpu className="h-3 w-3" />
                                Assigned Machines:
                              </span>
                              {machineNums.length > 0 ? (
                                machineNums.map((num) => (
                                  <span
                                    key={num}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-900"
                                  >
                                    {num}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-500">
                                  Pending assignment
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              <Layers className="h-3 w-3" />
                              Bulk Stock (No Machine #)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center">{item.rental_days}</td>
                      <td className="px-4 py-3 text-right">
                        {formatLKR(item.daily_rental_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatLKR(item.line_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Rental Fee Subtotal</span>
                <span>{formatLKR(rental.subtotal)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Refundable Deposit (10x)</span>
                <span>{formatLKR(rental.security_deposit)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-950">
                <span>Total Due</span>
                <span>{formatLKR(rental.final_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <Link
            href="/account/rentals"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            <CalendarClock className="h-4 w-4" />
            Track Rental Status
          </Link>
          <Link
            href="/rentals"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            Browse More Rentals
          </Link>
        </div>
      </div>
    </div>
  );
}
