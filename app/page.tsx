import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Headphones,
  Quote,
  ShieldCheck,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/catalog/ProductCard";
import { RentalProductCard } from "@/components/rentals/RentalProductCard";
import {
  getCachedCategories,
  getCachedProducts,
  getCachedPublicRentalReviews,
  getCachedPublicReviews,
  getCachedRentalCategories,
  getCachedRentalProducts,
} from "@/lib/catalog-server";
import { getProductPrimaryImage, slugify } from "@/lib/format";
import type { Product, RentalProduct } from "@/lib/types";

export default async function HomePage() {
  const [
    categories,
    rentalCategories,
    products,
    rentalProducts,
    publicReviews,
    publicRentalReviews,
  ] = await Promise.all([
    getCachedCategories(),
    getCachedRentalCategories(),
    getCachedProducts(),
    getCachedRentalProducts(),
    getCachedPublicReviews(),
    getCachedPublicRentalReviews(),
  ]);

  // Representative image per Sale Category
  const categoryVisuals = categories.map((cat) => {
    const match = products.find(
      (p) => p.category === cat.id && getProductPrimaryImage(p)
    );
    return {
      ...cat,
      image: match ? getProductPrimaryImage(match) : null,
      count: products.filter((p) => p.category === cat.id).length,
    };
  });

  // Featured For-Sale items
  const saleProducts = products.filter((p) => p.is_available);
  const featuredSale: Product[] = [
    ...saleProducts.filter((p) => p.reviews.length > 0 || p.variants.length > 0),
    ...saleProducts.filter(
      (p) => p.reviews.length === 0 && p.variants.length === 0
    ),
  ].slice(0, 8);

  // Featured Rental Fleet (mix bulk stock & machine-numbered assets)
  const availableRentals = rentalProducts.filter((p) => p.is_available);
  const featuredRentals: RentalProduct[] = [
    ...availableRentals.filter((p) => p.has_machine_numbers).slice(0, 3),
    ...availableRentals.filter((p) => !p.has_machine_numbers).slice(0, 2),
    ...availableRentals,
  ]
    .filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index)
    .slice(0, 4);

  const saleNameById = new Map(products.map((p) => [p.id, p.name]));
  const rentalNameById = new Map(rentalProducts.map((p) => [p.id, p.name]));

  const mergedReviews = [
    ...publicReviews
      .filter((r) => r.is_approved !== false && r.comment)
      .map((r) => ({
        key: `sale-${r.id}`,
        href: `/product/${r.product}`,
        rating: r.rating,
        comment: r.comment,
        title: saleNameById.get(r.product) || `Tool #${r.product}`,
        label: "Verified Purchase",
      })),
    ...publicRentalReviews
      .filter((r) => r.is_approved !== false && r.comment)
      .map((r) => ({
        key: `rent-${r.id}`,
        href: `/rentals/${r.rental_product}`,
        rating: r.rating,
        comment: r.comment,
        title:
          rentalNameById.get(r.rental_product) ||
          `Rental Equipment #${r.rental_product}`,
        label: "Verified Equipment Rental",
      })),
  ].slice(0, 4);

  return (
    <div className="flex flex-col bg-[#F8FAFC]">
      {/* 1. Industrial Hero Carousel */}
      <HeroCarousel />

      {/* 2. Shop by Category Strip (Sale Categories) */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Shop by Category
          </h2>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#D97706] hover:text-amber-800"
          >
            View All Categories
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryVisuals.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog/category/${slugify(cat.name)}`}
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs hover:border-[#F5A623] hover:shadow-md transition-all"
            >
              <div className="relative mb-3 h-24 w-full overflow-hidden rounded-lg bg-white">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 180px"
                    className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Wrench className="h-10 w-10" />
                  </div>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#D97706] line-clamp-2">
                {cat.name}
              </h3>
              <span className="mt-1 text-[11px] font-medium text-slate-500">
                {cat.count} {cat.count === 1 ? "item" : "items"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured For-Sale Equipment */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block h-[2px] w-10 bg-[#F5A623]" />
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Featured Products
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#D97706] hover:text-amber-800"
          >
            View All Products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredSale.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Separate Equipment Rental Fleet Section */}
      <section className="my-8 bg-slate-900 py-12 text-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EA580C]/20 border border-[#EA580C]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300 mb-2">
                <CalendarClock className="h-3.5 w-3.5" />
                Short-Term &amp; Site Rental Fleet
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Featured <span className="text-[#F5A623]">Rental Machinery</span>
              </h2>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Transparent daily rates with live calendar availability and a 100% refundable 10x security deposit upon return inspection.
              </p>
            </div>
            <Link
              href="/rentals"
              className="inline-flex items-center gap-2 rounded-lg bg-[#EA580C] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition-colors shrink-0"
            >
              Browse Full Rental Fleet ({rentalProducts.length})
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {rentalCategories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {rentalCategories.map((rc) => (
                <Link
                  key={rc.id}
                  href={`/rentals/category/${slugify(rc.name)}`}
                  className="rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#EA580C] hover:text-white transition-colors"
                >
                  {rc.name}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRentals.map((product) => (
              <RentalProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Rent & Buy from UDT */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:py-10">
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why Contractors Choose Universal Tool Depot
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Rugged equipment, clear pricing, and dedicated job-site logistics across Sri Lanka.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-[#D97706]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Certified Heavy Machinery
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Genuine Ronix, Dingqi, Bosch, Makita, DeWalt, and Stanley tools inspected before every dispatch.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-[#EA580C]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Transparent 100% Refundable Deposits
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Upfront 10x daily rate deposit calculation with zero hidden fees, refunded immediately upon return check.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Fast Job-Site Delivery
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Pin your exact construction gate or plot on our interactive map for direct driver dispatch islandwide.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Headphones className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              24/7 Breakdown Support
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Rapid replacement support and technical guidance via +94 706 611 936 so your crew never stalls.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Verified Contractor Reviews */}
      {mergedReviews.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block h-[2px] w-10 bg-[#F5A623]" />
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Verified Contractor Reviews
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs sm:text-sm font-bold text-[#D97706] hover:underline"
            >
              Browse Equipment &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mergedReviews.map((review) => (
              <Link
                key={review.key}
                href={review.href}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-[#F5A623]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="h-4 w-4 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {review.title}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                    {review.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
