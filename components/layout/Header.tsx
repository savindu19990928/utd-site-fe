"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  Headphones,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  PhoneCall,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User as UserIcon,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import {
  formatLKR,
  getEffectiveRentalPrice,
  getEffectiveSalePrice,
  getProductPrimaryImage,
  slugify,
} from "@/lib/format";
import type {
  Brand,
  Category,
  Product,
  RentalCategory,
  RentalProduct,
} from "@/lib/types";

interface HeaderProps {
  categories: Category[];
  rentalCategories: RentalCategory[];
  brands: Brand[];
  products: Product[];
  rentalProducts: RentalProduct[];
}

type SearchMatch =
  | { kind: "sale"; item: Product }
  | { kind: "rent"; item: RentalProduct };

export function Header({
  categories,
  rentalCategories,
  brands,
  products,
  rentalProducts,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const {
    cartCount,
    cartSubtotal,
    wishlistItems,
    openCartDrawer,
    registerProducts,
    registerRentalProducts,
    rentalDraft,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpenPath, setSearchOpenPath] = useState<string | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [catOpenPath, setCatOpenPath] = useState<string | null>(null);
  const [brandOpenPath, setBrandOpenPath] = useState<string | null>(null);
  const [userOpenPath, setUserOpenPath] = useState<string | null>(null);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);

  const searchOpen = searchOpenPath === pathname;
  const catMenuOpen = catOpenPath === pathname;
  const brandMenuOpen = brandOpenPath === pathname;
  const userMenuOpen = userOpenPath === pathname;
  const mobileNavOpen = mobileOpenPath === pathname;

  const setSearchOpen = (open: boolean) => setSearchOpenPath(open ? pathname : null);
  const setCatMenuOpen = (open: boolean | ((p: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(catMenuOpen) : open;
    setCatOpenPath(next ? pathname : null);
  };
  const setBrandMenuOpen = (open: boolean | ((p: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(brandMenuOpen) : open;
    setBrandOpenPath(next ? pathname : null);
  };
  const setUserMenuOpen = (open: boolean | ((p: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(userMenuOpen) : open;
    setUserOpenPath(next ? pathname : null);
  };
  const setMobileNavOpen = (open: boolean | ((p: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(mobileNavOpen) : open;
    setMobileOpenPath(next ? pathname : null);
  };

  const searchRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerProducts(products);
  }, [products, registerProducts]);

  useEffect(() => {
    registerRentalProducts(rentalProducts);
  }, [rentalProducts, registerRentalProducts]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpenPath(null);
      }
      if (catRef.current && !catRef.current.contains(target)) {
        setCatOpenPath(null);
      }
      if (brandRef.current && !brandRef.current.contains(target)) {
        setBrandOpenPath(null);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserOpenPath(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const saleCategoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of products) {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const rentalCategoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const rp of rentalProducts) {
      if (rp.category) counts[rp.category] = (counts[rp.category] || 0) + 1;
    }
    return counts;
  }, [rentalProducts]);

  const searchResults = useMemo<SearchMatch[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const saleMatches: SearchMatch[] = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand_name ?? "").toLowerCase().includes(q) ||
          (p.category_name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((item) => ({ kind: "sale", item }));

    const rentalMatches: SearchMatch[] = rentalProducts
      .filter(
        (rp) =>
          rp.name.toLowerCase().includes(q) ||
          rp.sku.toLowerCase().includes(q) ||
          (rp.brand_name ?? "").toLowerCase().includes(q) ||
          (rp.category_name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((item) => ({ kind: "rent", item }));

    return [...saleMatches, ...rentalMatches].slice(0, 7);
  }, [products, rentalProducts, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIdx >= 0 && searchResults[highlightedIdx]) {
      const selectedMatch = searchResults[highlightedIdx];
      setSearchOpen(false);
      router.push(
        selectedMatch.kind === "sale"
          ? `/product/${selectedMatch.item.id}`
          : `/rentals/${selectedMatch.item.id}`
      );
      return;
    }
    const q = searchQuery.trim();
    setSearchOpen(false);
    const onRentals = pathname.startsWith("/rentals");
    const base = onRentals ? "/rentals" : "/catalog";
    router.push(q ? `${base}?search=${encodeURIComponent(q)}` : base);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen && searchResults.length > 0) setSearchOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setHighlightedIdx(-1);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: HomeIcon, active: pathname === "/" },
    {
      href: "/catalog",
      label: "Shop",
      icon: Store,
      active: pathname.startsWith("/catalog") || pathname.startsWith("/product"),
    },
    {
      href: "/rentals",
      label: "Rentals",
      badge: "Fleet",
      active: pathname.startsWith("/rentals") || pathname.startsWith("/rental-checkout"),
    },
    { href: "/about", label: "About Us", active: pathname === "/about" },
    { href: "/contact", label: "Contact Us", active: pathname === "/contact" },
  ];

  const rentalDraftCount = rentalDraft?.items.length ?? 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top Dark Utility Bar */}
      <div className="bg-[#141414] text-slate-200 border-b border-zinc-800">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-[#F5A623]" aria-hidden="true" />
              Trusted Quality
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300 border-l border-zinc-700 pl-4">
              <Truck className="h-3.5 w-3.5 text-[#F5A623]" aria-hidden="true" />
              Fast Delivery Across Sri Lanka
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300 border-l border-zinc-700 pl-4">
              <Headphones className="h-3.5 w-3.5 text-[#F5A623]" aria-hidden="true" />
              24/7 Support
            </span>
            <span className="hidden xl:flex items-center gap-1.5 text-amber-300/90 border-l border-zinc-700 pl-4">
              Mon - Sat: 8:00 AM - 6:00 PM | Islandwide Equipment Rental
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1 rounded bg-[#F5A623] px-2 py-0.5 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
              >
                <LayoutDashboard className="h-3 w-3" aria-hidden="true" />
                Admin Portal
              </Link>
            )}

            <div className="relative" ref={userRef}>
              {isAuthenticated && user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-slate-100 hover:text-[#F5A623] transition-colors font-medium"
                    aria-expanded={userMenuOpen}
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#F5A623]" aria-hidden="true" />
                    <span className="max-w-[130px] truncate">
                      {user.first_name || user.username}
                    </span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl z-50">
                      <div className="border-b border-slate-100 px-4 py-2">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
                      >
                        <UserIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        My Profile
                      </Link>
                      <Link
                        href="/account/orders"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
                      >
                        <Package className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Orders
                      </Link>
                      <Link
                        href="/account/rentals"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
                      >
                        <CalendarClock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Rentals
                      </Link>
                      <Link
                        href="/account/addresses"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
                      >
                        <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Saved Addresses
                      </Link>
                      <Link
                        href="/account/wishlist"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
                      >
                        <Heart className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Wishlist
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2.5 border-t border-slate-100 mt-1 pt-2 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                        >
                          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                          Admin Operations Portal
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2.5 border-t border-slate-100 mt-1 pt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  <Link href="/login" className="hover:text-[#F5A623] transition-colors">
                    Login
                  </Link>
                  <span className="text-zinc-600">/</span>
                  <Link href="/register" className="hover:text-[#F5A623] transition-colors">
                    Register
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/account/wishlist"
              aria-label={`Wishlist (${wishlistItems.length} items)`}
              className="relative flex items-center text-slate-200 hover:text-[#F5A623] transition-colors border-l border-zinc-700 pl-3"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {wishlistItems.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold text-zinc-950">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openCartDrawer}
              title={
                cartCount > 0
                  ? `Cart Subtotal: ${formatLKR(cartSubtotal)}`
                  : "Open Shopping Cart"
              }
              aria-label={`Shopping cart with ${cartCount} items`}
              className="group relative flex items-center gap-1.5 text-white hover:text-[#F5A623] transition-colors border-l border-zinc-700 pl-3"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold text-zinc-950">
                {cartCount}
              </span>
              {cartCount > 0 && (
                <span className="hidden md:inline text-[11px] font-medium text-slate-300 group-hover:text-white">
                  {formatLKR(cartSubtotal, false)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Logo + Universal Search Bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 sm:py-3">
          <Link
            href="/"
            className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
          >
            <Image
              src="/images/utd-logo-clean.jpg"
              alt="Universal Tool Depot"
              width={168}
              height={58}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Search Bar with Live Autocomplete across Sale & Rental Catalogs */}
          <div className="relative flex-1 max-w-2xl" ref={searchRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-xs focus-within:border-[#F5A623] focus-within:ring-2 focus-within:ring-amber-400/25 transition-all"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                  setHighlightedIdx(-1);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search tools to buy or machinery to rent (name, SKU, brand)..."
                aria-label="Search for tools"
                className="w-full bg-transparent px-4 sm:px-5 py-2 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="flex items-center justify-center bg-[#F5A623] px-5 sm:px-6 py-2.5 sm:py-3 text-zinc-950 hover:bg-[#e09212] transition-colors"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" aria-hidden="true" />
              </button>
            </form>

            {searchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl z-50">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No sale or rental equipment matched &ldquo;{searchQuery}&rdquo;. Press Enter to search full catalog.
                  </div>
                ) : (
                  <ul role="listbox" className="divide-y divide-slate-100">
                    {searchResults.map((match, idx) => {
                      const item = match.item;
                      const img = getProductPrimaryImage(item);
                      const href =
                        match.kind === "sale"
                          ? `/product/${item.id}`
                          : `/rentals/${item.id}`;
                      return (
                        <li key={`${match.kind}-${item.id}`}>
                          <Link
                            href={href}
                            onClick={() => setSearchOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                              idx === highlightedIdx
                                ? "bg-amber-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                              {img ? (
                                <Image
                                  src={img}
                                  alt={item.name}
                                  fill
                                  sizes="44px"
                                  className="object-contain p-1"
                                />
                              ) : (
                                <Wrench className="m-auto h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                    match.kind === "sale"
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-orange-100 text-[#EA580C]"
                                  }`}
                                >
                                  {match.kind === "sale" ? "BUY" : "RENT"}
                                </span>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono">{item.sku}</span>
                                <span>•</span>
                                <span className="truncate">{item.category_name}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {match.kind === "sale" ? (
                                <p className="text-sm font-bold text-slate-900">
                                  {formatLKR(getEffectiveSalePrice(match.item), false)}
                                </p>
                              ) : (
                                <p className="text-xs font-bold text-[#EA580C]">
                                  {formatLKR(getEffectiveRentalPrice(match.item), false)}/day
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                    <li className="bg-slate-50 px-4 py-2 flex items-center justify-center gap-4 text-xs font-semibold">
                      <Link
                        href={`/catalog?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setSearchOpen(false)}
                        className="text-amber-700 hover:text-amber-800"
                      >
                        Search Shop &rarr;
                      </Link>
                      <span className="text-slate-300">|</span>
                      <Link
                        href={`/rentals?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setSearchOpen(false)}
                        className="text-[#EA580C] hover:underline"
                      >
                        Search Rentals &rarr;
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {rentalDraftCount > 0 && (
              <Link
                href="/rental-checkout"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold text-[#EA580C] hover:bg-orange-100 transition-colors"
                title="Complete your pending multi-item rental booking"
              >
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Rental Booking
                <span className="rounded-full bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {rentalDraftCount}
                </span>
              </Link>
            )}
            <Link
              href="/rentals"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg bg-[#EA580C] px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs"
            >
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Rent Fleet
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-6">
            {/* All Categories Mega Menu Trigger (Separate Sale & Rental Categories) */}
            <div className="relative" ref={catRef}>
              <button
                type="button"
                onClick={() => setCatMenuOpen((o) => !o)}
                aria-expanded={catMenuOpen}
                className="flex items-center gap-2.5 rounded-lg bg-[#F5A623] px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-[#e09212] transition-colors shadow-xs"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                <span>All Categories</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${catMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {catMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-[580px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 grid grid-cols-2 gap-4">
                  {/* Selling Categories */}
                  <div>
                    <div className="px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 border-b border-slate-100 mb-1">
                      Shop Categories (Buy New)
                    </div>
                    <div className="divide-y divide-slate-50">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog/category/${slugify(cat.name)}`}
                          onClick={() => setCatMenuOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 hover:bg-amber-50 hover:text-amber-950 transition-colors"
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {saleCategoryCounts[cat.id] ?? 0}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-slate-100 pt-2 px-2">
                      <Link
                        href="/catalog"
                        onClick={() => setCatMenuOpen(false)}
                        className="text-xs font-bold text-[#D97706] hover:underline"
                      >
                        Browse Shop Catalog ({products.length}) &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Separate Rental Categories */}
                  <div className="border-l border-slate-100 pl-4">
                    <div className="px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#EA580C] border-b border-slate-100 mb-1">
                      Rental Categories (Hire Fleet)
                    </div>
                    <div className="divide-y divide-slate-50">
                      {rentalCategories.map((rc) => (
                        <Link
                          key={rc.id}
                          href={`/rentals/category/${slugify(rc.name)}`}
                          onClick={() => setCatMenuOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 hover:bg-orange-50 hover:text-orange-950 transition-colors"
                        >
                          <span className="truncate">{rc.name}</span>
                          <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#EA580C]">
                            {rentalCategoryCounts[rc.id] ?? 0}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-slate-100 pt-2 px-2">
                      <Link
                        href="/rentals"
                        onClick={() => setCatMenuOpen(false)}
                        className="text-xs font-bold text-[#EA580C] hover:underline"
                      >
                        Browse Rental Fleet ({rentalProducts.length}) &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Nav Links */}
            <nav aria-label="Main navigation" className="flex items-center gap-5 lg:gap-7">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
                      item.active
                        ? "text-[#D97706]"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    {Icon && item.active && (
                      <Icon className="h-4 w-4 text-[#F5A623]" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#EA580C]">
                        {item.badge}
                      </span>
                    )}
                    {item.active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#F5A623]" />
                    )}
                  </Link>
                );
              })}

              {/* Brands Dropdown */}
              <div className="relative" ref={brandRef}>
                <button
                  type="button"
                  onClick={() => setBrandMenuOpen((o) => !o)}
                  aria-expanded={brandMenuOpen}
                  className={`flex items-center gap-1 py-2 text-sm font-semibold transition-colors ${
                    pathname.startsWith("/catalog/brand")
                      ? "text-[#D97706]"
                      : "text-slate-700 hover:text-slate-950"
                  }`}
                >
                  <span>Brands</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                {brandMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/catalog/brand/${slugify(brand.name)}`}
                        onClick={() => setBrandMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-950"
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Hotline Block */}
          <a
            href="tel:+94706611936"
            className="flex items-center gap-2.5 text-right hover:opacity-85 transition-opacity"
          >
            <PhoneCall className="h-6 w-6 text-slate-800 stroke-[1.75]" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">+94 706 611 936</p>
              <p className="text-[11px] text-slate-500">Get Help &amp; Support</p>
            </div>
          </a>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  item.active
                    ? "bg-amber-50 text-[#D97706]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#EA580C]">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            {rentalDraftCount > 0 && (
              <Link
                href="/rental-checkout"
                className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5 text-sm font-bold text-[#EA580C]"
              >
                <span>Active Rental Booking</span>
                <span className="rounded-full bg-[#EA580C] px-2 py-0.5 text-[10px] text-white">
                  {rentalDraftCount}
                </span>
              </Link>
            )}
          </nav>

          <div>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Shop Categories
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog/category/${slugify(cat.name)}`}
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-amber-400 hover:bg-amber-50 truncate"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-[#EA580C] mb-2">
              Rental Categories
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {rentalCategories.map((rc) => (
                <Link
                  key={rc.id}
                  href={`/rentals/category/${slugify(rc.name)}`}
                  className="rounded-lg border border-orange-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-orange-400 hover:bg-orange-50 truncate"
                >
                  {rc.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <a
              href="tel:+94706611936"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <PhoneCall className="h-4 w-4 text-[#F5A623]" />
              +94 706 611 936
            </a>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="rounded-md bg-[#F5A623] px-3 py-1.5 text-xs font-bold text-zinc-950"
              >
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
