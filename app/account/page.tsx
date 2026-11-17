"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Heart, MapPin, Package } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Address, Order, Rental } from "@/lib/types";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const { wishlistItems } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    api.listOrders().then(setOrders).catch(() => {});
    api.listRentals().then(setRentals).catch(() => {});
    api.listAddresses().then(setAddresses).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Welcome back, {user?.first_name || user?.username}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your contractor profile, job-site addresses, orders, and equipment rentals.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/account/orders"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400"
        >
          <Package className="h-5 w-5 text-[#F5A623]" />
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{orders.length}</p>
          <p className="text-xs font-semibold text-slate-500">Purchase Orders</p>
        </Link>

        <Link
          href="/account/rentals"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-orange-400"
        >
          <CalendarClock className="h-5 w-5 text-[#EA580C]" />
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{rentals.length}</p>
          <p className="text-xs font-semibold text-slate-500">Rental Bookings</p>
        </Link>

        <Link
          href="/account/addresses"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400"
        >
          <MapPin className="h-5 w-5 text-sky-600" />
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{addresses.length}</p>
          <p className="text-xs font-semibold text-slate-500">Saved Job Sites</p>
        </Link>

        <Link
          href="/account/wishlist"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-red-400"
        >
          <Heart className="h-5 w-5 text-red-500" />
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {wishlistItems.length}
          </p>
          <p className="text-xs font-semibold text-slate-500">Saved Tools</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <Link href="/account/orders" className="text-xs font-bold text-[#D97706] hover:underline">
              View All
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No orders placed yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 3).map((ord) => (
                <Link
                  key={ord.id}
                  href={`/account/orders/${encodeURIComponent(ord.order_number)}`}
                  className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50 rounded px-1"
                >
                  <div>
                    <p className="font-mono font-bold text-slate-900">{ord.order_number}</p>
                    <p className="text-slate-500">{formatDateDisplay(ord.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatLKR(ord.final_amount)}</p>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOrderStatusBadgeClasses(
                        ord.status
                      )}`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Rentals</h2>
            <Link href="/account/rentals" className="text-xs font-bold text-[#EA580C] hover:underline">
              View All
            </Link>
          </div>
          {rentals.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No rental reservations yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {rentals.slice(0, 3).map((rnt) => (
                <Link
                  key={rnt.id}
                  href={`/account/rentals/${encodeURIComponent(rnt.reference)}`}
                  className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50 rounded px-1"
                >
                  <div>
                    <p className="font-mono font-bold text-slate-900">{rnt.reference}</p>
                    <p className="text-slate-500">
                      {formatDateDisplay(rnt.start_date)} - {formatDateDisplay(rnt.end_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatLKR(rnt.final_amount)}</p>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOrderStatusBadgeClasses(
                        rnt.status
                      )}`}
                    >
                      {rnt.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
