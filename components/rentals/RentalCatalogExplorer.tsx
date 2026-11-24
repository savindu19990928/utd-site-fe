"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Box,
  CalendarClock,
  ChevronRight,
  Cpu,
  Filter,
  Grid2x2,
  Hammer,
  LayoutGrid,
  List,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { RentalProductCard } from "./RentalProductCard";
import { useStore } from "@/components/providers/StoreProvider";
import {
  formatLKR,
  getEffectiveRentalPrice,
  getEffectiveStock,
} from "@/lib/format";
import type { Brand, RentalCategory, RentalProduct } from "@/lib/types";

interface RentalCatalogExplorerProps {
  products: RentalProduct[];
  categories: RentalCategory[];
  brands: Brand[];
  initialCategoryId?: number | null;
  initialBrandId?: number | null;
  initialSearch?: string;
  initialTracking?: "all" | "bulk" | "numbered";
  bannerTitle?: string;
  bannerHighlight?: string;
  bannerSubtitle?: string;
}

const CATEGORY_ICONS = [Hammer, Wrench, Cpu, SlidersHorizontal, Box, Grid2x2, Sparkles];

export function RentalCatalogExplorer({
  products,
  categories,
  brands,
  initialCategoryId = null,
  initialBrandId = null,
  initialSearch = "",
  initialTracking = "all",
  bannerTitle = "Rental",
  bannerHighlight = "Fleet",
  bannerSubtitle = "Industrial machinery tracked by machine number & bulk site accessories ready to dispatch.",
}: RentalCatalogExplorerProps) {
  const { registerRentalProducts } = useStore();
  useEffect(() => {
    registerRentalProducts(products);
  }, [products, registerRentalProducts]);

  const maxCatalogPrice = useMemo(() => {
    const maxVal = products.reduce(
      (m, p) => Math.max(m, getEffectiveRentalPrice(p)),
      10000
    );
    return Math.ceil(maxVal / 1000) * 1000;
  }, [products]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    initialCategoryId ? [initialCategoryId] : []
  );
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>(
    initialBrandId ? [initialBrandId] : []
  );
  const [trackingFilter, setTrackingFilter] = useState<"all" | "bulk" | "numbered">(
    initialTracking
  );
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(maxCatalogPrice);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categoryCounts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of products) {
      if (p.category) map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [products]);

  const brandCounts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of products) {
      if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1;
    }
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const list = products.filter((p) => {
      if (trackingFilter === "bulk" && p.has_machine_numbers) return false;
      if (trackingFilter === "numbered" && !p.has_machine_numbers) return false;

      if (
        selectedCategoryIds.length > 0 &&
        (!p.category || !selectedCategoryIds.includes(p.category))
      ) {
        return false;
      }

      if (
        selectedBrandIds.length > 0 &&
        (!p.brand || !selectedBrandIds.includes(p.brand))
      ) {
        return false;
      }

      if (availableOnly && (!p.is_available || getEffectiveStock(p) <= 0)) {
        return false;
      }

      const rate = getEffectiveRentalPrice(p);
      if (rate < minPrice || rate > maxPrice) {
        return false;
      }

      if (q) {
        const hay = `${p.name} ${p.sku} ${p.description} ${p.brand_name ?? ""} ${
          p.category_name ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "rental_asc":
        sorted.sort(
          (a, b) => getEffectiveRentalPrice(a) - getEffectiveRentalPrice(b)
        );
        break;
      case "rental_desc":
        sorted.sort(
          (a, b) => getEffectiveRentalPrice(b) - getEffectiveRentalPrice(a)
        );
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "name_asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return sorted;
  }, [
    products,
    trackingFilter,
    selectedCategoryIds,
    selectedBrandIds,
    availableOnly,
    minPrice,
    maxPrice,
    searchTerm,
    sortBy,
  ]);

  const activeCategory =
    selectedCategoryIds.length === 1
      ? categories.find((c) => c.id === selectedCategoryIds[0])
      : null;

  const activeBrand =
    selectedBrandIds.length === 1
      ? brands.find((b) => b.id === selectedBrandIds[0])
      : null;

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleBrand = (brandId: number) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedBrandIds([]);
    setTrackingFilter("all");
    setSearchTerm("");
    setMinPrice(0);
    setMaxPrice(maxCatalogPrice);
    setAvailableOnly(false);
  };

  const hasActiveFilters =
    selectedCategoryIds.length > 0 ||
    selectedBrandIds.length > 0 ||
    trackingFilter !== "all" ||
    searchTerm.trim() !== "" ||
    minPrice > 0 ||
    maxPrice < maxCatalogPrice ||
    availableOnly;

  const FilterPanel = (
    <div className="space-y-5">
      {/* Rental Categories Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
            <h2 className="font-display text-lg font-extrabold text-slate-900">
              Rental Categories
            </h2>
          </div>
          {selectedCategoryIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategoryIds([])}
              className="text-xs font-semibold text-[#EA580C] hover:underline"
            >
              All
            </button>
          )}
        </div>

        <ul className="space-y-1.5">
          {categories.map((cat, idx) => {
            const Icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
            const isSelected = selectedCategoryIds.includes(cat.id);
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-orange-50 text-orange-950 border border-orange-300 shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-[#EA580C]" : "text-slate-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="ml-2 flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isSelected
                          ? "bg-[#EA580C] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {categoryCounts[cat.id] ?? 0}
                    </span>
                    {isSelected && (
                      <ChevronRight className="h-3.5 w-3.5 text-[#EA580C]" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Asset Tracking Mode Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Fleet Tracking Mode
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: "all", label: "All Rental Equipment" },
            { id: "bulk", label: "Bulk Stock (No Machine #)" },
            { id: "numbered", label: "Machine-Numbered Assets" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setTrackingFilter(opt.id as "all" | "bulk" | "numbered")
              }
              className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                trackingFilter === opt.id
                  ? "bg-[#EA580C] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Brands
        </h3>
        <div className="space-y-2">
          {brands.map((brand) => {
            const checked = selectedBrandIds.includes(brand.id);
            return (
              <label
                key={brand.id}
                className="flex items-center justify-between text-sm text-slate-700 cursor-pointer hover:text-slate-950"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(brand.id)}
                    className="h-4 w-4 rounded border-slate-300 text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <span className={checked ? "font-bold text-slate-950" : "font-medium"}>
                    {brand.name}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  ({brandCounts[brand.id] ?? 0})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Daily Rate Range */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daily Rate (LKR)
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Max {formatLKR(maxPrice, false)}/d
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-500">Min / Day</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              step={100}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value) || 0))}
              className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Max / Day</label>
            <input
              type="number"
              min={minPrice}
              max={maxCatalogPrice}
              step={100}
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(
                  Math.min(maxCatalogPrice, Math.max(minPrice, Number(e.target.value) || 0))
                )
              }
              className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
            />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={maxCatalogPrice}
          step={250}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum daily rental rate filter"
          className="w-full accent-[#EA580C]"
        />
      </div>

      {/* Availability Toggle */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-slate-800">
            Available Fleet Only
          </span>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#EA580C] focus:ring-[#EA580C]"
          />
        </label>
      </div>

      {/* Link back to Sales Catalog */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-900">
          <ShoppingBag className="h-4 w-4" />
          <p className="text-xs font-extrabold uppercase tracking-wider">
            Buying Tools Outright?
          </p>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Browse our separate Sales Catalog for brand-new equipment with manufacturer warranties.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706] hover:underline"
        >
          Go to Shop Catalog &rarr;
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#F8FAFC]">
      {/* Industrial Rental Banner */}
      <section className="relative overflow-hidden bg-[#141414] text-white">
        <div className="relative mx-auto max-w-[1400px] min-h-[190px] sm:min-h-[230px] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="/images/catalog-banner.jpg"
              alt="Universal Tool Depot Rental Fleet"
              fill
              priority
              sizes="100vw"
              className="object-cover object-right opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/90 sm:via-[#141414]/70 to-transparent" />
            <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-7 bg-[#EA580C] utd-diagonal-amber-left z-10" />
            <div
              className="hidden md:block absolute top-0 bottom-0 left-[44%] w-16 bg-[#EA580C] -skew-x-[24deg] opacity-90 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="relative z-20 px-6 sm:px-14 py-10 max-w-xl">
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
              <span className="text-white">{bannerTitle} </span>
              <span className="text-[#F5A623]">{bannerHighlight}</span>
            </h1>
            <p className="mt-2 font-display text-lg sm:text-xl italic text-slate-200">
              {bannerSubtitle}
            </p>
            <div className="mt-3 h-0.5 w-24 bg-[#EA580C]" />
          </div>
        </div>
      </section>

      {/* Main 2-column Rental Catalog Workspace */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="hidden lg:block lg:col-span-3">{FilterPanel}</aside>

          <div className="lg:col-span-9 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {activeCategory
                    ? activeCategory.name
                    : activeBrand
                    ? `${activeBrand.name} Rental Fleet`
                    : "Equipment Rental Fleet"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {activeCategory?.description ||
                    `Showing ${filteredProducts.length} of ${products.length} rentable tools & machines`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <Filter className="h-4 w-4 text-[#EA580C]" />
                  Filters
                </button>

                <div className="flex items-center gap-2">
                  <label htmlFor="rental-sort" className="text-xs font-semibold text-slate-600">
                    Sort by:
                  </label>
                  <select
                    id="rental-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#EA580C] focus:outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest First</option>
                    <option value="rental_asc">Daily Rate: Low to High</option>
                    <option value="rental_desc">Daily Rate: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 mr-1">View:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className={`rounded-lg p-2 border transition-colors ${
                      viewMode === "grid"
                        ? "bg-[#EA580C] border-[#EA580C] text-white"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={`rounded-lg p-2 border transition-colors ${
                      viewMode === "list"
                        ? "bg-[#EA580C] border-[#EA580C] text-white"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Deposit Policy Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter rental fleet by name, SKU, or spec..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-slate-900 focus:border-[#EA580C] focus:bg-white focus:outline-none"
                />
              </div>

              <Link
                href="/terms-and-conditions#rental"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:underline"
              >
                <CalendarClock className="h-4 w-4" />
                10x Refundable Deposit Policy Applies
              </Link>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategoryIds.map((cid) => {
                  const cat = categories.find((c) => c.id === cid);
                  if (!cat) return null;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => toggleCategory(cid)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-300 px-3 py-1 text-xs font-bold text-orange-950"
                    >
                      {cat.name}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
                {selectedBrandIds.map((bid) => {
                  const brand = brands.find((b) => b.id === bid);
                  if (!brand) return null;
                  return (
                    <button
                      key={bid}
                      type="button"
                      onClick={() => toggleBrand(bid)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-800"
                    >
                      Brand: {brand.name}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
                {trackingFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setTrackingFilter("all")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-900"
                  >
                    {trackingFilter === "numbered"
                      ? "Machine-Numbered Only"
                      : "Bulk Stock Only"}
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {availableOnly && (
                  <button
                    type="button"
                    onClick={() => setAvailableOnly(false)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900"
                  >
                    Available Only
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-red-600 hover:underline ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <Wrench className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  No rental equipment matched your filters
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your daily rate range or clearing active category/tracking filters.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-lg bg-[#EA580C] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <RentalProductCard key={product.id} product={product} view="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <RentalProductCard key={product.id} product={product} view="list" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet Modal */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Rental Fleet Filters"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[#F8FAFC] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Filter Rental Fleet
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterPanel}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#EA580C] py-3 text-sm font-bold text-white"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
