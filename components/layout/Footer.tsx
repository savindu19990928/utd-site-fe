import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-auto bg-[#0F172A] text-slate-300 no-print">
      {/* Bottom Trust Strip matching Catalog & About PNG mockups */}
      <div className="relative overflow-hidden bg-[#141414] border-t border-b border-zinc-800">
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-10 bg-[#F5A623] utd-diagonal-amber-left" />
        <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row items-center justify-between gap-6 px-4 lg:pl-14 lg:pr-0">
          <div className="grid w-full lg:w-auto grid-cols-1 sm:grid-cols-3 gap-6 py-5 lg:py-6 flex-1">
            <div className="flex items-center gap-3.5 sm:border-r sm:border-zinc-800 sm:pr-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623]">
                <Truck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Free Delivery</p>
                <p className="text-xs text-slate-400">Islandwide</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:border-r sm:border-zinc-800 sm:pr-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623]">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Trusted Quality</p>
                <p className="text-xs text-slate-400">Guaranteed</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623]">
                <Headphones className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">24/7 Customer Support</p>
                <p className="text-xs text-slate-400">Breakdown &amp; Dispatch Care</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-[#F5A623] px-6 py-5 lg:py-6 text-zinc-950 lg:pl-10 [clip-path:none] lg:[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
            <p className="font-display text-xl font-extrabold italic tracking-tight">
              Build Better. Do More.
            </p>
            <p className="text-xs font-semibold text-zinc-900">
              with Universal Tool Depot
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-white p-2">
              <Image
                src="/images/utd-logo-clean.jpg"
                alt="Universal Tool Depot"
                width={140}
                height={48}
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Sri Lanka&apos;s specialized digital marketplace for contractor-grade power tools, heavy construction equipment sales, and instant islandwide equipment rentals.
            </p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5A623]" aria-hidden="true" />
                <span>No. 452, Galle Road, Colombo 03, Western Province, Sri Lanka</span>
              </p>
              <p className="pl-5 font-mono text-slate-500">Reg No: PV 00248912</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalog?for_sale=true" className="hover:text-[#F5A623] transition-colors">
                  Buy Equipment
                </Link>
              </li>
              <li>
                <Link href="/rentals" className="hover:text-[#F5A623] transition-colors">
                  Rent Heavy Equipment
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#F5A623] transition-colors">
                  About Universal Tool Depot
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-[#F5A623] transition-colors">
                  Rental Terms &amp; Security Deposits
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions#warranty" className="hover:text-[#F5A623] transition-colors">
                  Warranty &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#F5A623] transition-colors">
                  Contact &amp; Branch Locator
                </Link>
              </li>
            </ul>
          </div>

          {/* Equipment Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Equipment Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalog/category/${slugify(cat.name)}`}
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Customer Care
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:+94706611936"
                  className="flex items-center gap-2.5 text-white font-semibold hover:text-[#F5A623]"
                >
                  <Phone className="h-4 w-4 text-[#F5A623]" aria-hidden="true" />
                  +94 706 611 936
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/94706611936"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-emerald-400 font-medium hover:text-emerald-300"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp Direct Dispatch
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@universaltooldepot.lk"
                  className="flex items-center gap-2.5 hover:text-[#F5A623]"
                >
                  <Mail className="h-4 w-4 text-[#F5A623]" aria-hidden="true" />
                  support@universaltooldepot.lk
                </a>
              </li>
            </ul>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs">
              <p className="font-semibold text-white">Showroom &amp; Yard Hours</p>
              <p className="mt-0.5 text-slate-400">Mon - Sat: 8:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Accepted Payments & Copyright */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-400">
            &copy; 2026 Universal Tool Depot. Developed by <a href="https://www.devrious.lk">Devrious</a>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="text-slate-500 font-normal mr-1">Accepted Payments:</span>
            <span className="rounded bg-white px-2.5 py-1 text-pink-700">KOKO</span>
            <span className="rounded bg-white px-2.5 py-1 text-indigo-700">Mintpay</span>
            <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-slate-200">VISA</span>
            <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-slate-200">Mastercard</span>
            <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-amber-400">
              Bank Transfer
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
