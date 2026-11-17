"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  MapPin,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api-client";
import {
  formatDateTimeDisplay,
  formatLKR,
  getMapsHref,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Order, Payment } from "@/lib/types";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const orderNumber = decodeURIComponent(params.orderNumber || "");
  const orderIdParam = searchParams.get("id");

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [extras, setExtras] = useState<{
    houseNumber?: string;
    locationTag?: string;
    bankSlipName?: string;
    bankRefNote?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(`utd_order_${orderNumber}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (mounted) {
              setOrder(parsed.order);
              setPayment(parsed.payment);
              setExtras({
                houseNumber: parsed.houseNumber,
                locationTag: parsed.locationTag,
                bankSlipName: parsed.bankSlipName,
                bankRefNote: parsed.bankRefNote,
              });
            }
          } catch {
            // ignore
          }
        }
      }

      if (isAuthenticated) {
        try {
          if (orderIdParam && /^\d+$/.test(orderIdParam)) {
            const fresh = await api.getOrder(Number(orderIdParam));
            if (mounted) setOrder(fresh);
          } else {
            const list = await api.listOrders();
            const found = list.find((o) => o.order_number === orderNumber);
            if (found && mounted) setOrder(found);
          }
        } catch {
          // keep session snapshot
        }
      }
      if (mounted) setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [orderNumber, orderIdParam, isAuthenticated]);

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">
        Loading order confirmation...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900">
          Order {orderNumber} not found in current session.
        </p>
        <Link
          href="/account/orders"
          className="inline-block rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-zinc-950"
        >
          View My Order History
        </Link>
      </div>
    );
  }

  const mapsLink = getMapsHref(order.delivery_location_tag || extras.locationTag);

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 space-y-6 print-container">
        {/* Status Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950">
            Thank you! Your order has been placed.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Order Number:{" "}
            <span className="font-mono font-bold text-slate-950">{order.order_number}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClasses(
                order.status
              )}`}
            >
              Status: {order.status}
            </span>
            {payment && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                Payment: {payment.method} ({payment.status})
              </span>
            )}
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Universal Tool Depot — Tax &amp; Dispatch Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Issued on {formatDateTimeDisplay(order.created_at)}
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-600">
              <p className="font-bold text-slate-950">{order.order_number}</p>
              {payment?.transaction_id && <p>TXN: {payment.transaction_id}</p>}
            </div>
          </div>

          {/* Delivery Site & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                Delivery Job-Site Snapshot
              </p>
              <p className="font-semibold text-slate-900">
                {extras.houseNumber || order.house_number
                  ? `Gate/Plot: ${extras.houseNumber || order.house_number} — `
                  : ""}
                {order.delivery_street}
              </p>
              <p className="text-slate-700">
                {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
              </p>
              {order.customer_mobile && (
                <p className="text-slate-600">Mobile: {order.customer_mobile}</p>
              )}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-bold text-[#D97706] hover:underline no-print"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open Site Pin on Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-slate-500">
                Payment Instructions
              </p>
              {payment?.method === "BANK_TRANSFER" ? (
                <>
                  <p className="font-bold text-slate-900">
                    Commercial Bank of Ceylon &bull; A/C 1000 8923 4510
                  </p>
                  <p className="text-slate-600">
                    Universal Tool Depot (Pvt) Ltd (Colombo 03). Quote{" "}
                    <strong className="font-mono">{order.order_number}</strong> as remark.
                  </p>
                  {extras.bankSlipName && (
                    <p className="text-emerald-700 font-semibold">
                      Slip attached: {extras.bankSlipName}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-900">
                    {payment?.method || "Online Installment Gateway"}
                  </p>
                  <p className="text-slate-600">
                    Total Amount: <strong>{formatLKR(order.final_amount)}</strong> (3
                    installments of {formatLKR(parseFloat(order.final_amount) / 3)}).
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Item / SKU</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">
                        {item.product_name || `Product #${item.product}`}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {item.sku} {item.variant_name ? `• ${item.variant_name}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatLKR(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatLKR(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
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
                <span>Total Payable</span>
                <span>{formatLKR(order.final_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print Invoice / Download Receipt
          </button>
          <Link
            href={`/account/orders/${encodeURIComponent(order.order_number)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Track Order Status
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-5 py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212]"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
