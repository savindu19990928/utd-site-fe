"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Cpu,
  Edit2,
  Layers,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatLKR,
  getEffectiveRentalPrice,
  getEffectiveStock,
  getProductPrimaryImage,
} from "@/lib/format";
import type { RentalCategory, RentalProduct } from "@/lib/types";

export default function AdminRentalProductsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<RentalProduct[]>([]);
  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [trackingFilter, setTrackingFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listRentalProducts(undefined, { auth: true }),
      api.listRentalCategories(),
    ])
      .then(([prods, cats]) => {
        if (!active) return;
        setProducts(prods);
        setCategories(cats);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && String(p.category) !== categoryFilter) return false;
      if (trackingFilter === "bulk" && p.has_machine_numbers) return false;
      if (trackingFilter === "numbered" && !p.has_machine_numbers) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.brand_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, trackingFilter]);

  const handleDelete = async (p: RentalProduct) => {
    if (!window.confirm(`Delete rental equipment "${p.name}" (${p.sku})?`)) return;
    try {
      await api.deleteRentalProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      showToast(`Deleted ${p.name}.`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Could not delete rental product.",
        "error"
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const created = await api.createRentalCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setCatName("");
      setCatDesc("");
      showToast(`Rental category "${created.name}" created.`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not create rental category.",
        "error"
      );
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: RentalCategory) => {
    if (!window.confirm(`Delete rental category "${cat.name}"?`)) return;
    try {
      await api.deleteRentalCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast(`Deleted rental category "${cat.name}".`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete rental category.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Rental Catalog, Categories &amp; Machine Numbers
          </h1>
          <p className="text-sm text-slate-600">
            Manage rental-only products, separate rental categories, bulk stock items, and alphanumeric machine numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => setTab("products")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold ${
                tab === "products"
                  ? "bg-white text-slate-950 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Rental Products ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("categories")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold ${
                tab === "categories"
                  ? "bg-white text-slate-950 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Rental Categories ({categories.length})
            </button>
          </div>

          <Link
            href="/admin/rental-products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add Rental Equipment
          </Link>
        </div>
      </div>

      {tab === "products" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rental equipment by name, SKU, or brand..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-[#EA580C] focus:outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
            >
              <option value="">All Rental Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
            >
              <option value="">All Tracking Modes</option>
              <option value="bulk">Bulk Stock (No Machine #)</option>
              <option value="numbered">Machine-Numbered</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                  <tr>
                    <th className="px-4 py-3">Rental Equipment</th>
                    <th className="px-4 py-3">Rental Category / Brand</th>
                    <th className="px-4 py-3">Tracking Mode</th>
                    <th className="px-4 py-3 text-right">Daily Rate</th>
                    <th className="px-4 py-3 text-center">Available Units</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        Loading rental catalog...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No matching rental products found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const img = getProductPrimaryImage(p);
                      const stock = getEffectiveStock(p);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={p.name}
                                    fill
                                    sizes="44px"
                                    className="object-contain p-1"
                                  />
                                ) : (
                                  <Wrench className="m-auto h-5 w-5 text-slate-300" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1">
                                  {p.name}
                                </p>
                                <span className="font-mono text-xs text-slate-500">
                                  {p.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <p className="font-semibold text-slate-800">
                              {p.category_name || "—"}
                            </p>
                            <p className="text-slate-500">{p.brand_name || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {p.has_machine_numbers ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-bold text-indigo-800">
                                <Cpu className="h-3 w-3" />
                                Machine # ({p.machines?.length ?? stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                                <Layers className="h-3 w-3" />
                                Bulk Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#EA580C]">
                            {formatLKR(getEffectiveRentalPrice(p), false)}/d
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                stock <= 0
                                  ? "bg-red-100 text-red-700"
                                  : stock <= 2
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/admin/rental-products/${p.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => void handleDelete(p)}
                                aria-label={`Delete ${p.name}`}
                                className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900">
              Add Rental Category
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rental Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Rental Floor & Surface Machinery"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Describe this rental category..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={catSaving}
              className="w-full rounded-xl bg-[#EA580C] py-2.5 text-xs font-extrabold text-white hover:bg-orange-700"
            >
              {catSaving ? "Creating..." : "Create Rental Category"}
            </button>
          </form>

          <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Rental Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {cat.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat)}
                        aria-label={`Delete ${cat.name}`}
                        className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
