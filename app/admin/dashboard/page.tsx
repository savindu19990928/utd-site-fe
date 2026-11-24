"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getEffectiveStock,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Order, Payment, Product, Rental, RentalProduct } from "@/lib/types";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rentalProducts, setRentalProducts] = useState<RentalProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listProducts().catch(() => []),
      api.listRentalProducts(undefined, { auth: true }).catch(() => []),
      api.listOrders().catch(() => []),
      api.listRentals().catch(() => []),
      api.listPayments().catch(() => []),
    ])
      .then(([p, rp, o, r, pay]) => {
        setProducts(p);
        setRentalProducts(rp);
        setOrders(o);
        setRentals(r);
        setPayments(pay);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    const orderRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((acc, o) => acc + (parseFloat(o.final_amount) || 0), 0);
    const rentalRevenue = rentals
      .filter((r) => r.status !== "CANCELLED")
      .reduce((acc, r) => acc + (parseFloat(r.subtotal) || 0), 0);
    const activeRentals = rentals.filter((r) => r.status === "ACTIVE").length;
    const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
    const lowStock = products.filter((p) => getEffectiveStock(p) <= 5);
    const pendingPayments = payments.filter((p) => p.status === "PENDING").length;

    return {
      totalRevenue: orderRevenue + rentalRevenue,
      activeRentals,
      pendingOrders,
      lowStock,
      pendingPayments,
    };
  }, [orders, rentals, products, payments]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const key = p.category_name || "Sale Uncategorized";
      map[key] = (map[key] || 0) + 1;
    }
    for (const rp of rentalProducts) {
      const key = rp.category_name || "Rental Uncategorized";
      map[key] = (map[key] || 0) + 1;
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(1, ...entries.map((e) => e[1]));
    return entries.map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / maxCount) * 100),
    }));
  }, [products, rentalProducts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Overview of separate sale &amp; rental catalogs, machine-numbered fleet availability, and Direct Bank Transfer verifications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5A623] px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212]"
          >
            <Plus className="h-4 w-4" />
            Add Sale Product
          </Link>
          <Link
            href="/admin/rental-products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add Rental Equipment
          </Link>
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
          >
            Pending Bank Slips ({kpis.pendingPayments})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              Gross Revenue
            </span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? "..." : formatLKR(kpis.totalRevenue, false)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across {orders.length} orders &amp; {rentals.length} rentals
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              Active Equipment on Rent
            </span>
            <CalendarClock className="h-5 w-5 text-[#EA580C]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? "..." : kpis.activeRentals}
          </p>
          <Link
            href="/admin/rentals"
            className="mt-1 inline-block text-xs font-bold text-[#EA580C] hover:underline"
          >
            Manage rental fleet ({rentalProducts.length} items) &rarr;
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              Pending Sales Orders
            </span>
            <ShoppingBag className="h-5 w-5 text-[#F5A623]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? "..." : kpis.pendingOrders}
          </p>
          <Link
            href="/admin/orders"
            className="mt-1 inline-block text-xs font-bold text-[#D97706] hover:underline"
          >
            View sales orders &rarr;
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              Low Sale Stock (&le;5)
            </span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? "..." : kpis.lowStock.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Out of {products.length} sale SKUs ({rentalProducts.length} rental SKUs)
          </p>
        </div>
      </div>

      {/* Category Inventory Chart + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Sale &amp; Rental Catalog Distribution by Category
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="font-mono text-slate-600">{item.count} SKUs</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      item.name.toLowerCase().includes("rental")
                        ? "bg-[#EA580C]"
                        : "bg-[#F5A623]"
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Low Stock Sale SKUs</h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#D97706] hover:underline"
            >
              All Sale Products
            </Link>
          </div>
          {kpis.lowStock.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-4 font-semibold">
              All sale equipment has healthy stock levels (&gt; 5 units).
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {kpis.lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50 px-1 rounded"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="font-mono text-slate-400">{p.sku}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 font-bold text-red-700">
                    {getEffectiveStock(p)} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Rentals Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#F5A623]" />
              Recent Sales Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#D97706] hover:underline"
            >
              Manage All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-mono font-bold text-slate-900">{o.order_number}</p>
                  <p className="text-slate-500">{formatDateDisplay(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatLKR(o.final_amount)}</p>
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOrderStatusBadgeClasses(
                      o.status
                    )}`}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="py-4 text-xs text-slate-500">No orders recorded yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#EA580C]" />
              Recent Rental Bookings
            </h2>
            <Link
              href="/admin/rentals"
              className="text-xs font-bold text-[#EA580C] hover:underline"
            >
              Manage Fleet
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {rentals.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-mono font-bold text-slate-900">{r.reference}</p>
                  <p className="text-slate-500">
                    {formatDateDisplay(r.start_date)} &rarr; {formatDateDisplay(r.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatLKR(r.final_amount)}</p>
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOrderStatusBadgeClasses(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
            {rentals.length === 0 && (
              <p className="py-4 text-xs text-slate-500">No rental bookings recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
