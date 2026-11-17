"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

const SLIDES = [
  {
    id: "slide-1",
    eyebrow: "CONSTRUCTION & DIY TOOLS",
    titlePrefix: "Build More.",
    titleHighlight: "Do More.",
    subtitle: "with Universal Tool Depot",
    description:
      "High-quality construction and DIY tools for professionals and enthusiasts across Sri Lanka.",
    image: "/images/hero-slide-1.jpg",
    primaryCta: { label: "Shop Now", href: "/catalog" },
    secondaryCta: { label: "Rent Equipment", href: "/rentals" },
  },
  {
    id: "slide-2",
    eyebrow: "HEAVY RENTAL FLEET & WELDING",
    titlePrefix: "Power Every",
    titleHighlight: "Job Site.",
    subtitle: "with Certified Rental Fleet",
    description:
      "Instant multi-day availability checks, transparent 10x refundable deposits, and fast job-site dispatch.",
    image: "/images/hero-slide-2.jpg",
    primaryCta: { label: "Explore Rental Fleet", href: "/rentals" },
    secondaryCta: { label: "Browse All Tools", href: "/catalog" },
  },
];

export function HeroCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[activeIdx];

  return (
    <section
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative w-full overflow-hidden bg-[#141414] text-white"
    >
      <div className="relative mx-auto max-w-[1400px] min-h-[340px] sm:min-h-[400px] lg:min-h-[430px] flex items-center">
        {/* Background studio image positioned on right */}
        <div className="absolute inset-0">
          <Image
            src={slide.image}
            alt={`${slide.titlePrefix} ${slide.titleHighlight}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-right opacity-90 transition-opacity duration-500"
          />
          {/* Smooth left-to-right industrial dark gradient + subtle diagonal amber bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/92 sm:via-[#141414]/75 to-transparent" />
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-7 bg-[#F5A623] utd-diagonal-amber-left z-10" />
          <div
            className="hidden lg:block absolute top-0 bottom-0 left-[46%] w-24 bg-[#F5A623]/90 -skew-x-[24deg] opacity-15 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Left Content Column */}
        <div className="relative z-20 w-full max-w-2xl px-8 sm:px-14 lg:px-16 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-200">
              {slide.eyebrow}
            </span>
            <span className="h-[2px] w-16 bg-[#F5A623]" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.03]">
            <span className="text-white">{slide.titlePrefix} </span>
            <span className="text-[#F5A623]">{slide.titleHighlight}</span>
          </h1>

          <p className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold italic text-slate-100">
            {slide.subtitle}
          </p>

          <p className="mt-3 max-w-md text-sm sm:text-base text-slate-300 leading-relaxed">
            {slide.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={slide.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-6 py-3 text-sm font-extrabold text-zinc-950 shadow-lg hover:bg-[#e09212] transition-all"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              {slide.primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={slide.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all"
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              {slide.secondaryCta.label}
            </Link>
          </div>
        </div>

        {/* Left / Right Circular Carousel Arrows matching PNG */}
        <button
          type="button"
          onClick={() =>
            setActiveIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
          }
          aria-label="Previous slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700 hover:bg-[#F5A623] hover:text-zinc-950 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveIdx((prev) => (prev + 1) % SLIDES.length)}
          aria-label="Next slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700 hover:bg-[#F5A623] hover:text-zinc-950 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Bottom-left Dots matching PNG */}
        <div className="absolute bottom-4 left-8 sm:left-14 lg:left-16 z-30 flex items-center gap-2">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                idx === activeIdx
                  ? "w-7 bg-[#F5A623]"
                  : "w-2.5 bg-zinc-500/80 hover:bg-zinc-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
