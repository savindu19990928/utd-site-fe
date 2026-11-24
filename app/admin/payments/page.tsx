"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatDateTimeDisplay,
  formatLKR,
  getOrderStatusBadgeClasses,
} from "@/lib/format";
import type { Payment, Refund } from "@/lib/types";

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [tab, setTab] = useState<"payments" | "refunds">("payments");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listPayments().catch(() => []),
      api.listRefunds().catch(() => []),
    ])
      .then(([p, r]) => {
        if (!active) return;
        setPayments(p);
        setRefunds(r);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleProcess = async (
    payment: Payment,
    result: "SUCCESS" | "FAILED" | "CANCELLED"
  ) => {
    setBusyId(payment.id);
    try {
      const updated = await api.processPayment(payment.id, result);
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? updated : p)));
      showToast(
        `Payment ${payment.transaction_id || payment.id} marked as ${result}.`,
        result === "SUCCESS" ? "success" : "warning"
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Payment processing failed.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Bank Transfer Verification &amp; Payment Audit
          </h1>
          <p className="text-sm text-slate-600">
            Verify Direct Bank Transfer payments and audit refund records.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-200 p-1">
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
              tab === "payments" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600"
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("refunds")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
              tab === "refunds" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600"
            }`}
          >
            Refunds ({refunds.length})
          </button>
        </div>
      </div>

      {tab === "payments" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Order / TXN</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-slate-950">
                          {pay.order_number || `Order #${pay.order}`}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {pay.transaction_id || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">
                        <p>{pay.method}</p>
                        {pay.bank_reference && (
                          <p className="font-mono text-[11px] font-normal text-slate-500">
                            Ref: {pay.bank_reference}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTimeDisplay(pay.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                        {formatLKR(pay.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getOrderStatusBadgeClasses(
                            pay.status
                          )}`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pay.status === "PENDING" ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === pay.id}
                              onClick={() => void handleProcess(pay, "SUCCESS")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve Payment
                            </button>
                            <button
                              type="button"
                              disabled={busyId === pay.id}
                              onClick={() => void handleProcess(pay, "FAILED")}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Refund ID</th>
                  <th className="px-4 py-3">Payment #</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No refunds logged.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref) => (
                    <tr key={ref.id}>
                      <td className="px-4 py-3 font-mono font-bold">#{ref.id}</td>
                      <td className="px-4 py-3 font-mono">Payment #{ref.payment}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{ref.reason}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatLKR(ref.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold">
                        {ref.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
