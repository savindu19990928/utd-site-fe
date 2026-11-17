import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms, Rental Policies & Deposit Coverage",
};

export default function TermsPage() {
  return (
    <div className="bg-[#F8FAFC] py-10">
      <div className="mx-auto max-w-4xl px-4 space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-[#141414] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F5A623]">
            Universal Tool Depot Policy Charter
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">
            Terms, Rental Policies &amp; Damage Coverage
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Clear guidelines covering outright purchases, warranty claims, 10x refundable rental deposits, and site dispatch across Sri Lanka.
          </p>
        </div>

        <section
          id="rental"
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2.5 text-[#EA580C]">
            <CalendarClock className="h-6 w-6" />
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              1. Equipment Rental &amp; 10x Refundable Security Deposit
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            Every short-term rental reservation requires a minimum duration of 1 day (calculated inclusively from Start Date through End Date). To safeguard contractor-grade machinery, Universal Tool Depot collects a <strong>100% refundable security deposit equal to 10x the daily rental rate</strong> per rented unit.
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Full Transparency:</strong> Deposit amounts are itemized upfront on product pages, booking summaries, and printable receipts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Immediate Refund Release:</strong> Once equipment returns to our depot or is picked up and passes standard functional inspection, the full security deposit is released immediately.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Normal Wear vs. Misuse:</strong> Routine wear on bits, brushes, and blades is covered. Damage caused by improper voltage supply, missing major accessories, or severe structural neglect may be deducted transparently at repair cost.
              </span>
            </li>
          </ul>
        </section>

        <section
          id="warranty"
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2.5 text-[#D97706]">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              2. Outright Purchases, Warranty &amp; Bank Verification
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            New equipment purchases carry the manufacturer or Universal Tool Depot warranty indicated on each product detail page (typically 6 months to Lifetime Hand Tool coverage).
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              &bull; <strong>Payment Options:</strong> We support Koko (3 interest-free installments), Mintpay (3 card installments), and Direct Bank Transfer to Commercial Bank of Ceylon (Account 1000 8923 4510, Colombo 03).
            </li>
            <li>
              &bull; <strong>Cancellations:</strong> Pending sales orders and pending rental bookings can be cancelled prior to dispatch without penalty.
            </li>
            <li>
              &bull; <strong>Job-Site Dispatch:</strong> Accurate house/plot numbers, mobile numbers (`07XXXXXXXX`), and GPS coordinates ensure rapid islandwide delivery.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/rentals"
            className="rounded-lg bg-[#EA580C] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
          >
            Browse Rental Fleet
          </Link>
          <Link
            href="/catalog"
            className="rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-[#e09212]"
          >
            Shop Equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
