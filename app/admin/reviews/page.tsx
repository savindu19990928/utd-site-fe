"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Star, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import { formatDateDisplay } from "@/lib/format";
import type { ProductReview } from "@/lib/types";

export default function AdminReviewsPage() {
  const { productsById } = useStore();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .listReviews()
      .then((list) => {
        if (active) setReviews(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleApprove = async (rev: ProductReview) => {
    try {
      const updated = await api.updateReview(rev.id, { is_approved: true });
      setReviews((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
      showToast("Review approved for public storefront.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not approve review.",
        "error"
      );
    }
  };

  const handleDelete = async (rev: ProductReview) => {
    try {
      await api.deleteReview(rev.id);
      setReviews((prev) => prev.filter((r) => r.id !== rev.id));
      showToast("Review deleted.", "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete review.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Customer Review Moderation Queue
        </h1>
        <p className="text-sm text-slate-600">
          Approve verified contractor feedback or remove inappropriate submissions.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Product</th>
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
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No customer reviews in queue.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
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
                              onClick={() => void handleApprove(rev)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDelete(rev)}
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
