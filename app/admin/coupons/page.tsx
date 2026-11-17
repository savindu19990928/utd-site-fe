"use client";

import React, { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import { formatDateDisplay, formatLKR } from "@/lib/format";
import type { Coupon } from "@/lib/types";

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    code: "",
    discount_type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discount_value: "10.00",
    min_purchase_amount: "5000.00",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    let active = true;
    api
      .listCoupons()
      .then((list) => {
        if (active) setCoupons(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setCoupons([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    try {
      const payload: Coupon = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_purchase_amount: form.min_purchase_amount || null,
        is_active: form.is_active,
        ...(form.start_date
          ? { start_date: `${form.start_date}T00:00:00Z` }
          : {}),
        ...(form.end_date ? { end_date: `${form.end_date}T23:59:59Z` } : {}),
      };
      const created = await api.createCoupon(payload);
      setCoupons((prev) => [created, ...prev]);
      setForm({
        code: "",
        discount_type: "PERCENTAGE",
        discount_value: "10.00",
        min_purchase_amount: "5000.00",
        start_date: "",
        end_date: "",
        is_active: true,
      });
      showToast(`Coupon ${created.code} created!`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not create coupon.",
        "error"
      );
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      await api.deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      showToast(`Coupon ${coupon.code} removed.`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete coupon.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Coupons &amp; Promotional Campaigns
        </h1>
        <p className="text-sm text-slate-600">
          Configure percentage or fixed LKR discount vouchers with minimum purchase rules.
        </p>
      </div>

      {/* Create Coupon Form */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#F5A623]" />
          Create Promotional Coupon
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="CONTRACTOR15"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type
            </label>
            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  discount_type: e.target.value as "PERCENTAGE" | "FIXED",
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              <option value="PERCENTAGE">PERCENTAGE (%)</option>
              <option value="FIXED">FIXED (LKR)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Value *
            </label>
            <input
              type="text"
              required
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Min Spend (LKR)
            </label>
            <input
              type="text"
              value={form.min_purchase_amount}
              onChange={(e) =>
                setForm({ ...form, min_purchase_amount: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[#F5A623]"
            />
            Campaign Active Immediately
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5A623] px-5 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212]"
          >
            <Plus className="h-4 w-4" />
            Create Coupon
          </button>
        </div>
      </form>

      {/* Coupons List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Min Spend</th>
                <th className="px-4 py-3">Validity Window</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-extrabold text-slate-950">
                      {c.code}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{c.discount_type}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {c.discount_type === "PERCENTAGE"
                        ? `${c.discount_value}%`
                        : formatLKR(c.discount_value)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {c.min_purchase_amount ? formatLKR(c.min_purchase_amount) : "None"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.start_date || c.end_date
                        ? `${formatDateDisplay(c.start_date)} - ${formatDateDisplay(c.end_date)}`
                        : "Always Active"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.id && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(c)}
                          className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
