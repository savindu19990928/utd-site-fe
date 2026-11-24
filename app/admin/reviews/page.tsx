"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Star, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import { formatDateDisplay } from "@/lib/format";
import type { ProductReview, RentalProductReview } from "@/lib/types";

export default function AdminReviewsPage() {
  const { productsById, rentalProductsById } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"sale" | "rental">("sale");
  const [saleReviews, setSaleReviews] = useState<ProductReview[]>([]);
  const [rentalReviews, setRentalReviews] = useState<RentalProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listReviews().catch(() => []),
      api.listRentalReviews().catch(() => []),
    ])
      .then(([saleList, rentalList]) => {
        if (!active) return;
        setSaleReviews(Array.isArray(saleList) ? saleList : []);
        setRentalReviews(Array.isArray(rentalList) ? rentalList : []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleApproveSale = async (rev: ProductReview) => {
    try {
      const updated = await api.updateReview(rev.id, { is_approved: true });
      setSaleReviews((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
      showToast("Sale review approved for storefront.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not approve review.",
        "error"
      );
    }
  };

  const handleDeleteSale = async (rev: ProductReview) => {
    try {
      await api.deleteReview(rev.id);
      setSaleReviews((prev) => prev.filter((r) => r.id !== rev.id));
      showToast("Sale review deleted.", "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete review.",
        "error"
      );
    }
  };

  const handleApproveRental = async (rev: RentalProductReview) => {
    try {
      const updated = await api.updateRentalReview(rev.id, { is_approved: true });
      setRentalReviews((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
      showToast("Rental review approved for fleet page.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not approve review.",
        "error"
      );
    }
  };

  const handleDeleteRental = async (rev: RentalProductReview) => {
    try {
      await api.deleteRentalReview(rev.id);
      setRentalReviews((prev) => prev.filter((r) => r.id !== rev.id));
      showToast("Rental review deleted.", "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete review.",
        "error"
      );
    }
  };

  const activeList = tab === "sale" ? saleReviews : rentalReviews;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Customer Review Moderation Queue
          </h1>
          <p className="text-sm text-slate-600">
            Moderate feedback across both Sale Products and Rental Fleet Equipment.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-200 p-1">
          <button
            type="button"
            onClick={() => setTab("sale")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
              tab === "sale"
                ? "bg-white text-slate-950 shadow-2xs"
                : "text-slate-600"
            }`}
          >
            Sale Reviews ({saleReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("rental")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
              tab === "rental"
                ? "bg-white text-slate-950 shadow-2xs"
                : "text-slate-600"
            }`}
          >
            Rental Reviews ({rentalReviews.length})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">
                  {tab === "sale" ? "Sale Product" : "Rental Equipment"}
                </th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : activeList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No customer reviews in queue.
                  </td>
                </tr>
              ) : tab === "sale" ? (
                saleReviews.map((rev) => {
                  const prod = productsById[rev.product];
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs">
                        <Link
                          href={`/product/${rev.product}`}
                          className="font-bold text-slate-900 hover:text-[#D97706]"
                        >
                          {prod?.name || `Product #${rev.product}`}
                        </Link>
                        <p className="text-slate-400">
                          User #{rev.user} &bull; {formatDateDisplay(rev.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex text-[#F5A623]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating ? "fill-current" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-md">
                        {rev.comment || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            rev.is_approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {rev.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {!rev.is_approved && (
                            <button
                              type="button"
                              onClick={() => void handleApproveSale(rev)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDeleteSale(rev)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                rentalReviews.map((rev) => {
                  const rp = rentalProductsById[rev.rental_product];
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs">
                        <Link
                          href={`/rentals/${rev.rental_product}`}
                          className="font-bold text-slate-900 hover:text-[#EA580C]"
                        >
                          {rp?.name || `Rental Equipment #${rev.rental_product}`}
                        </Link>
                        <p className="text-slate-400">
                          User #{rev.user} &bull; {formatDateDisplay(rev.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex text-[#F5A623]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating ? "fill-current" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-md">
                        {rev.comment || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            rev.is_approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {rev.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {!rev.is_approved && (
                            <button
                              type="button"
                              onClick={() => void handleApproveRental(rev)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDeleteRental(rev)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
