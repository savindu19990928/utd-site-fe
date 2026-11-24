"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatDateDisplay,
  formatLKR,
  getEffectiveStock,
  toISODateInput,
} from "@/lib/format";
import type {
  Order,
  Payment,
  Product,
  Refund,
  Rental,
  RentalProduct,
} from "@/lib/types";

function downloadCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const escape = (val: string | number) => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const today = useMemo(() => toISODateInput(new Date()), []);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODateInput(d);
  }, []);

  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rentalProducts, setRentalProducts] = useState<RentalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listOrders().catch(() => []),
      api.listRentals().catch(() => []),
      api.listPayments().catch(() => []),
      api.listRefunds().catch(() => []),
      api.listProducts().catch(() => []),
      api.listRentalProducts(undefined, { auth: true }).catch(() => []),
    ])
      .then(([o, r, pay, ref, prod, rentProd]) => {
        setOrders(o);
        setRentals(r);
        setPayments(pay);
        setRefunds(ref);
        setProducts(prod);
        setRentalProducts(rentProd);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = o.created_at?.slice(0, 10) || "";
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      }),
    [orders, fromDate, toDate]
  );
  const filteredRentals = useMemo(
    () =>
      rentals.filter((r) => {
        const d = r.created_at?.slice(0, 10) || "";
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      }),
    [rentals, fromDate, toDate]
  );
  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const d = p.created_at?.slice(0, 10) || "";
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      }),
    [payments, fromDate, toDate]
  );

  const paymentMethodTotals = useMemo(() => {
    const totals: Record<string, { count: number; amount: number }> = {
      BANK_TRANSFER: { count: 0, amount: 0 },
    };
    for (const p of filteredPayments) {
      const key = p.method || "BANK_TRANSFER";
      if (!totals[key]) totals[key] = { count: 0, amount: 0 };
      totals[key].count += 1;
      totals[key].amount += parseFloat(p.amount) || 0;
    }
    return totals;
  }, [filteredPayments]);

  const lowStockItems = useMemo(() => {
    const saleWatch = products
      .filter((p) => getEffectiveStock(p) <= 10)
      .map((p) => ({
        key: `sale-${p.id}`,
        name: p.name,
        sku: p.sku,
        type: "SALE" as const,
        stock: getEffectiveStock(p),
      }));
    const rentalWatch = rentalProducts
      .filter((rp) => getEffectiveStock(rp) <= 10)
      .map((rp) => ({
        key: `rent-${rp.id}`,
        name: rp.name,
        sku: rp.sku,
        type: "RENTAL" as const,
        stock: getEffectiveStock(rp),
      }));
    return [...saleWatch, ...rentalWatch].sort((a, b) => a.stock - b.stock);
  }, [products, rentalProducts]);

  const reportCards = [
    {
      title: "1. Product Sales Report",
      description: `${filteredOrders.length} sales orders within selected window`,
      onCsv: () =>
        downloadCSV(
          `utd-product-sales-${fromDate}-to-${toDate}.csv`,
          ["Order Number", "Date", "Status", "City", "Subtotal", "Discount", "Final Amount"],
          filteredOrders.map((o) => [
            o.order_number,
            formatDateDisplay(o.created_at),
            o.status,
            o.delivery_city || "",
            o.subtotal,
            o.discount_amount,
            o.final_amount,
          ])
        ),
    },
    {
      title: "2. Rental Fleet Utilization Report",
      description: `${filteredRentals.length} equipment rental reservations`,
      onCsv: () =>
        downloadCSV(
          `utd-rental-utilization-${fromDate}-to-${toDate}.csv`,
          ["Reference", "Start Date", "End Date", "Status", "Rental Fee", "Security Deposit", "Total"],
          filteredRentals.map((r) => [
            r.reference,
            r.start_date,
            r.end_date,
            r.status,
            r.subtotal,
            r.security_deposit,
            r.final_amount,
          ])
        ),
    },
    {
      title: "3. Bank Transfer Income Breakdown",
      description: `${filteredPayments.length} Direct Bank Transfer transactions`,
      onCsv: () =>
        downloadCSV(
          `utd-payment-breakdown-${fromDate}-to-${toDate}.csv`,
          ["Order Number", "Method", "Status", "Transaction ID", "Bank Ref", "Amount", "Created"],
          filteredPayments.map((p) => [
            p.order_number,
            p.method,
            p.status,
            p.transaction_id || "",
            p.bank_reference || "",
            p.amount,
            formatDateDisplay(p.created_at),
          ])
        ),
    },
    {
      title: "4. Rental Deposit & Refunds Audit",
      description: `${filteredRentals.length} deposits & ${refunds.length} payment refunds`,
      onCsv: () =>
        downloadCSV(
          `utd-deposits-refunds-${fromDate}-to-${toDate}.csv`,
          ["Reference", "Rental Status", "Deposit Amount", "Deposit State"],
          filteredRentals.map((r) => [
            r.reference,
            r.status,
            r.security_deposit,
            r.status === "COMPLETED" || r.status === "CANCELLED" ? "REFUNDED" : "HELD",
          ])
        ),
    },
    {
      title: "5. Inventory Stock Depletion Report",
      description: `${lowStockItems.length} Sale & Rental SKUs at or below 10 units`,
      onCsv: () =>
        downloadCSV(
          `utd-inventory-depletion-${today}.csv`,
          [
            "Catalog Type",
            "SKU",
            "Name",
            "Category",
            "Brand",
            "Tracking Mode",
            "Available Stock",
            "Price / Daily Rate",
          ],
          [
            ...products.map((p) => [
              "SALE",
              p.sku,
              p.name,
              p.category_name || "",
              p.brand_name || "",
              "Sale Stock",
              getEffectiveStock(p),
              p.sale_price,
            ]),
            ...rentalProducts.map((rp) => [
              "RENTAL",
              rp.sku,
              rp.name,
              rp.category_name || "",
              rp.brand_name || "",
              rp.has_machine_numbers ? "Machine-Numbered" : "Bulk Stock",
              getEffectiveStock(rp),
              `${rp.rental_price}/day`,
            ]),
          ]
        ),
    },
  ];

  return (
    <div className="space-y-6 print-container">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Financial, Rental &amp; Inventory Reports
          </h1>
          <p className="text-sm text-slate-600">
            Filter operational reports by date range and export CSV spreadsheets or printable PDF summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          Export Printable PDF Report
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="no-print flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          />
        </div>
      </div>

      {/* 5 Exportable Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        {reportCards.map((rc) => (
          <div
            key={rc.title}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">{rc.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{rc.description}</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={rc.onCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        ))}
      </div>

      {/* Printable Summary Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Income by Payment Method
          </h2>
          <div className="divide-y divide-slate-100 text-sm">
            {Object.entries(paymentMethodTotals).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {method === "BANK_TRANSFER"
                      ? "Direct Bank Transfer (BANK_TRANSFER)"
                      : method}
                  </p>
                  <p className="text-xs text-slate-500">{data.count} transactions</p>
                </div>
                <span className="font-extrabold text-slate-950">
                  {formatLKR(data.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Low Stock Watchlist (&le; 10 units)
          </h2>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs">
            {lowStockItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        item.type === "SALE"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-orange-100 text-[#EA580C]"
                      }`}
                    >
                      {item.type}
                    </span>
                    <p className="font-bold text-slate-900">{item.name}</p>
                  </div>
                  <p className="font-mono text-slate-400 mt-0.5">{item.sku}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900">
                  {item.stock} units
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
