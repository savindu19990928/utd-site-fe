"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Printer } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateTimeDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrderSnapshotPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listOrders()
      .then((list) => {
        const match = list.find(
          (o) => o.order_number === orderNumber || String(o.id) === orderNumber
        );
        setOrder(match ?? null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading invoice snapshot...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
        <p className="font-bold text-slate-900">Order {orderNumber} not found.</p>
        <Link href="/account/orders" className="text-sm font-bold text-[#D97706] underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const mapsLink = getMapsHref(order.delivery_location_tag);

  return (
    <div className="space-y-5 print-container">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order History
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Universal Tool Depot Invoice
            </p>
            <h1 className="font-mono text-2xl font-extrabold text-slate-950">
              {order.order_number}
            </h1>
            <p className="text-xs text-slate-500">
              Placed: {formatDateTimeDisplay(order.created_at)}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClasses(
              order.status
            )}`}
          >
            {order.status}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
          <p className="font-bold uppercase text-slate-500">Delivery Snapshot</p>
          <p className="font-semibold text-slate-900">
            {order.house_number ? `Plot/Gate ${order.house_number}, ` : ""}
            {order.delivery_street}
          </p>
          <p className="text-slate-600">
            {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
          </p>
          {order.customer_mobile && <p>Mobile: {order.customer_mobile}</p>}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#D97706] hover:underline no-print"
            >
              <MapPin className="h-3.5 w-3.5" />
              Open Delivery Pin
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {item.sku} {item.variant_name ? `• ${item.variant_name}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatLKR(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatLKR(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatLKR(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount ({order.coupon_code})</span>
                <span>-{formatLKR(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-950">
              <span>Final Amount</span>
              <span>{formatLKR(order.final_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
