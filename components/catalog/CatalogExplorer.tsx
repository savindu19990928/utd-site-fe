"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Box,
  CalendarClock,
  ChevronRight,
  Filter,
  Grid2x2,
  Hammer,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useStore } from "@/components/providers/StoreProvider";
import {
  formatLKR,
  getEffectiveSalePrice,
  getEffectiveStock,
} from "@/lib/format";
import type { Brand, Category, Product } from "@/lib/types";

interface CatalogExplorerProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  initialCategoryId?: number | null;
  initialBrandId?: number | null;
  initialSearch?: string;
  bannerTitle?: string;
  bannerHighlight?: string;
  bannerSubtitle?: string;
}

const CATEGORY_ICONS = [Wrench, Hammer, Sparkles, SlidersHorizontal, Box, Grid2x2];

export function CatalogExplorer({
  products,
  categories,
  brands,
  initialCategoryId = null,
  initialBrandId = null,
  initialSearch = "",
  bannerTitle = "Our",
  bannerHighlight = "Catalog",
  bannerSubtitle = "Explore our wide range of construction and DIY tools for purchase.",
}: CatalogExplorerProps) {
  const { registerProducts } = useStore();
  React.useEffect(() => {
    registerProducts(products);
  }, [products, registerProducts]);

  const maxCatalogPrice = useMemo(() => {
    const maxVal = products.reduce((m, p) => {
      return Math.max(m, getEffectiveSalePrice(p));
    }, 100000);
    return Math.ceil(maxVal / 5000) * 5000;
  }, [products]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    initialCategoryId ? [initialCategoryId] : []
  );
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>(
    initialBrandId ? [initialBrandId] : []
  );
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(maxCatalogPrice);
  const [inStockOnly, setInStockOnly] = useState(false);
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

      if (inStockOnly && (!p.is_available || getEffectiveStock(p) <= 0)) {
        return false;
      }

      const salePrice = getEffectiveSalePrice(p);
      if (salePrice < minPrice || salePrice > maxPrice) {
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
      case "price_asc":
        sorted.sort((a, b) => getEffectiveSalePrice(a) - getEffectiveSalePrice(b));
        break;
      case "price_desc":
        sorted.sort((a, b) => getEffectiveSalePrice(b) - getEffectiveSalePrice(a));
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
    selectedCategoryIds,
    selectedBrandIds,
    inStockOnly,
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
    setSearchTerm("");
    setMinPrice(0);
    setMaxPrice(maxCatalogPrice);
    setInStockOnly(false);
  };

  const hasActiveFilters =
    selectedCategoryIds.length > 0 ||
    selectedBrandIds.length > 0 ||
    searchTerm.trim() !== "" ||
    minPrice > 0 ||
    maxPrice < maxCatalogPrice ||
    inStockOnly;

  const FilterPanel = (
    <div className="space-y-5">
      {/* Sale Categories Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-slate-900" aria-hidden="true" />
            <h2 className="font-display text-lg font-extrabold text-slate-900">
              Shop Categories
            </h2>
          </div>
          {selectedCategoryIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategoryIds([])}
              className="text-xs font-semibold text-[#D97706] hover:underline"
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
                      ? "bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-[#D97706]" : "text-slate-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="ml-2 flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isSelected
                          ? "bg-[#F5A623] text-zinc-950"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {categoryCounts[cat.id] ?? 0}
                    </span>
                    {isSelected && (
                      <ChevronRight className="h-3.5 w-3.5 text-[#D97706]" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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
                    className="h-4 w-4 rounded border-slate-300 text-[#F5A623] focus:ring-[#F5A623]"
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

      {/* Price Range */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Price Range (LKR)
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Max {formatLKR(maxPrice, false)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-500">Min</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              step={500}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value) || 0))}
              className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Max</label>
            <input
              type="number"
              min={minPrice}
              max={maxCatalogPrice}
              step={500}
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
          step={1000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum price filter"
          className="w-full accent-[#F5A623]"
        />
      </div>

      {/* Availability Toggle */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-slate-800">In Stock Only</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#F5A623] focus:ring-[#F5A623]"
          />
        </label>
      </div>

      {/* Separate Rental Fleet Callout */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-[#EA580C]">
          <CalendarClock className="h-4 w-4" />
          <p className="text-xs font-extrabold uppercase tracking-wider">
            Need Equipment to Rent?
          </p>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Rental machinery &amp; bulk scaffolding gear have their own dedicated catalog and categories.
        </p>
        <Link
          href="/rentals"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#EA580C] hover:underline"
        >
          Browse Separate Rental Fleet &rarr;
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#F8FAFC]">
      {/* Diagonal Industrial Catalog Banner */}
      <section className="relative overflow-hidden bg-[#141414] text-white">
        <div className="relative mx-auto max-w-[1400px] min-h-[190px] sm:min-h-[230px] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="/images/catalog-banner.jpg"
              alt="Universal Tool Depot Catalog"
              fill
              priority
              sizes="100vw"
              className="object-cover object-right opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/90 sm:via-[#141414]/70 to-transparent" />
            <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-7 bg-[#F5A623] utd-diagonal-amber-left z-10" />
            <div
              className="hidden md:block absolute top-0 bottom-0 left-[44%] w-16 bg-[#F5A623] -skew-x-[24deg] opacity-90 pointer-events-none"
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
            <div className="mt-3 h-0.5 w-24 bg-[#F5A623]" />
          </div>
        </div>
      </section>

      {/* Main 2-column Catalog Workspace */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">{FilterPanel}</aside>

          {/* Right Product Grid & Controls */}
          <div className="lg:col-span-9 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {activeCategory
                    ? activeCategory.name
                    : activeBrand
                    ? `${activeBrand.name} Equipment`
                    : "All Tools & Equipment for Sale"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {activeCategory?.description ||
                    `Showing ${filteredProducts.length} of ${products.length} contractor-grade tools`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <Filter className="h-4 w-4 text-[#D97706]" />
                  Filters
                </button>

                <div className="flex items-center gap-2">
                  <label htmlFor="catalog-sort" className="text-xs font-semibold text-slate-600">
                    Sort by:
                  </label>
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#F5A623] focus:outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
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
                        ? "bg-[#F5A623] border-[#F5A623] text-zinc-950"
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
                        ? "bg-[#F5A623] border-[#F5A623] text-zinc-950"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter sale catalog by name, SKU, or spec..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-slate-900 focus:border-[#F5A623] focus:bg-white focus:outline-none"
                />
              </div>

              <Link
                href="/rentals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:underline"
              >
                <CalendarClock className="h-4 w-4" />
                Looking to hire? Switch to Rental Fleet &rarr;
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-950"
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
                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900"
                  >
                    In Stock Only
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

            {/* Products List / Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <Wrench className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  No equipment matched your filters
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try widening your price range or clearing active category/brand filters.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-[#e09212]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="list" />
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
          aria-label="Catalog Filters"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[#F8FAFC] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Filter Equipment
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
              className="mt-5 w-full rounded-xl bg-[#F5A623] py-3 text-sm font-bold text-zinc-950"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
