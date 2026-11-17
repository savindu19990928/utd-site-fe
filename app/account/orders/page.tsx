"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Order } from "@/lib/types";

const ORDER_TABS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    api
      .listOrders()
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Order History
          </h1>
          <p className="text-sm text-slate-500">
            Track purchase shipments and print tax invoices for your jobs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filter === tab
                  ? "bg-[#F5A623] text-zinc-950"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab === "ALL" ? "All Orders" : tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading order history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-base font-bold text-slate-900">No orders found</p>
          <Link
            href="/catalog"
            className="mt-4 inline-block rounded-lg bg-[#F5A623] px-5 py-2.5 text-xs font-bold text-zinc-950"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const currentStepIdx = STEPS.indexOf(order.status);
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="font-mono text-base font-extrabold text-slate-950">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      Placed on {formatDateDisplay(order.created_at)} &bull;{" "}
                      {order.items.length} line item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-slate-950">
                      {formatLKR(order.final_amount)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClasses(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Status Stepper */}
                {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {STEPS.map((st, idx) => {
                      const done = currentStepIdx >= idx;
                      return (
                        <div key={st} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              done ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          />
                          <p
                            className={`text-[10px] font-bold ${
                              done ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {st}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <p className="text-slate-600 line-clamp-1">
                    {order.items
                      .map((i) => `${i.product_name || "Tool"} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                  <Link
                    href={`/account/orders/${encodeURIComponent(order.order_number)}`}
                    className="inline-flex items-center gap-1 font-bold text-[#D97706] hover:underline"
                  >
                    View Invoice Snapshot
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
