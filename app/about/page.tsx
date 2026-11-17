import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Handshake,
  HardHat,
  Lightbulb,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Universal Tool Depot was founded to make high-quality construction and DIY tools easily accessible to contractors and enthusiasts across Sri Lanka.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white">
      {/* Top Diagonal Hero Banner matching About Us PNG */}
      <section className="relative overflow-hidden bg-[#141414] text-white">
        <div className="relative mx-auto max-w-[1400px] min-h-[210px] sm:min-h-[260px] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="/images/about-banner.jpg"
              alt="Universal Tool Depot Site Engineer"
              fill
              priority
              sizes="100vw"
              className="object-cover object-right opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/92 sm:via-[#141414]/75 to-transparent" />
            <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-7 bg-[#F5A623] utd-diagonal-amber-left z-10" />
            <div
              className="hidden md:block absolute top-0 bottom-0 left-[46%] w-16 bg-[#F5A623] -skew-x-[24deg] opacity-90 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="relative z-20 px-6 sm:px-14 py-12 max-w-xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="text-white">About </span>
              <span className="text-[#F5A623]">Us</span>
            </h1>
            <p className="mt-2 font-display text-xl sm:text-2xl italic text-slate-200">
              Your Trusted Partner for Tools and More
            </p>
            <div className="mt-3 h-0.5 w-24 bg-[#F5A623]" />
          </div>
        </div>
      </section>

      {/* Our Story Section matching About Us PNG */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
                Our Story
              </h2>
              <div className="mt-2 h-[3px] w-16 bg-[#F5A623]" />
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-slate-700">
              <strong className="font-bold text-slate-950">Universal Tool Depot</strong> was founded with a simple mission — to make high-quality construction and DIY tools easily accessible to everyone in Sri Lanka. We understand the importance of reliable tools, whether you&apos;re a professional contractor managing a large build or a DIY enthusiast, and we&apos;re here to provide the best products with exceptional service.
            </p>

            <p className="text-sm sm:text-base leading-relaxed text-slate-700">
              With the trusted <strong className="font-semibold text-slate-900">Universal Tools</strong> brand, we bring you a wide range of powerful and durable tools for outright purchase and short-term rental at competitive prices, backed by expert support, transparent refundable security deposits, and a seamless online shopping experience.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
              <Image
                src="/images/about-story.jpg"
                alt="Universal Tool Depot Workshop Workbench"
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Our Values Card Strip matching About Us PNG */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-100/80 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div className="md:border-r md:border-slate-300 md:pr-6">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Our Values
              </h2>
              <div className="mt-2 h-[3px] w-14 bg-[#F5A623]" />
            </div>

            <div className="flex items-start gap-3 md:border-r md:border-slate-200 md:pr-4">
              <ShieldCheck className="h-9 w-9 shrink-0 text-[#F5A623] stroke-[1.75]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quality First</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Only the best contractor-grade tools for your work.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:border-r md:border-slate-200 md:pr-4">
              <Handshake className="h-9 w-9 shrink-0 text-[#F5A623] stroke-[1.75]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Focus</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Your site uptime and satisfaction are our priority.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:border-r md:border-slate-200 md:pr-4">
              <Lightbulb className="h-9 w-9 shrink-0 text-[#F5A623] stroke-[1.75]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Innovation</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Live fleet calendars, GPS site pins &amp; smarter job-site solutions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="h-9 w-9 shrink-0 text-[#F5A623] stroke-[1.75]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reliable Service</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Fast and secure delivery islandwide across Sri Lanka.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner matching About Us PNG */}
      <section className="relative overflow-hidden bg-[#141414] text-white">
        <div className="relative mx-auto max-w-[1400px] px-6 sm:px-14 py-9 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/images/cta-banner.jpg"
              alt="Construction site skyline"
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-7 bg-[#F5A623] utd-diagonal-amber-left" />
          </div>

          <div className="relative z-10 flex items-center gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623] bg-zinc-900 text-[#F5A623]">
              <HardHat className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold italic">
                <span className="text-white">Build. Create. </span>
                <span className="text-[#F5A623]">Get It Done.</span>
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                With <strong className="italic text-white">Universal Tool Depot</strong>, you&apos;re always ready for the next project.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-7 py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212] transition-colors shadow-lg"
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rentals"
              className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 transition-colors shadow-lg"
            >
              Rent Equipment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
