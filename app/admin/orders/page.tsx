"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, MapPin, Search, X } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateTimeDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listOrders()
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (q) {
        const hay = `${o.order_number} ${o.delivery_city ?? ""} ${
          o.customer_mobile ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Sales Order Manager
          </h1>
          <p className="text-sm text-slate-600">
            Inspect customer purchases, delivery site pins, and payment verification status.
          </p>
        </div>
        <Link
          href="/admin/payments"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
        >
          Verify Pending Payments &rarr;
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, city, or mobile..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Delivery City / Mobile</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No matching orders.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-950">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTimeDisplay(ord.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-semibold text-slate-800">
                        {ord.delivery_city || "—"}
                      </p>
                      <p className="text-slate-500">{ord.customer_mobile || "No mobile"}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {formatLKR(ord.final_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getOrderStatusBadgeClasses(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Snapshot Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-mono text-xl font-extrabold text-slate-950">
                  {selectedOrder.order_number}
                </h2>
                <p className="text-xs text-slate-500">
                  Customer #{selectedOrder.user} &bull; {selectedOrder.order_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
              <p className="font-bold uppercase text-slate-500">Delivery Location Snapshot</p>
              <p className="font-semibold text-slate-900">
                {selectedOrder.house_number ? `Gate/Plot ${selectedOrder.house_number}, ` : ""}
                {selectedOrder.delivery_street}
              </p>
              <p>
                {selectedOrder.delivery_city}, {selectedOrder.delivery_state}{" "}
                {selectedOrder.delivery_zip_code}
              </p>
              <p>Mobile: {selectedOrder.customer_mobile || "—"}</p>
              {getMapsHref(selectedOrder.delivery_location_tag) && (
                <a
                  href={getMapsHref(selectedOrder.delivery_location_tag)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#D97706] hover:underline pt-1"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open Site GPS Pin
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="font-mono text-slate-500">
                      {item.sku} &times; {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">{formatLKR(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-extrabold">
              <span>Final Amount</span>
              <span>{formatLKR(selectedOrder.final_amount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
