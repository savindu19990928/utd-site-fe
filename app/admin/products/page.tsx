"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit2, Plus, Search, Trash2, Wrench } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import {
  formatLKR,
  getEffectiveSalePrice,
  getEffectiveStock,
  getProductPrimaryImage,
} from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.listProducts(), api.listCategories()])
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
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.brand_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter]);

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}" (${p.sku}) permanently?`)) return;
    try {
      await api.deleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      showToast(`Deleted ${p.name}.`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete product.",
        "error"
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const created = await api.createCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setCatName("");
      setCatDesc("");
      showToast(`Sale category "${created.name}" created.`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not create category.",
        "error"
      );
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Delete sale category "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast(`Deleted category "${cat.name}".`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete category.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Sale Catalog &amp; Categories
          </h1>
          <p className="text-sm text-slate-600">
            Manage outright-purchase products and sale categories (separate from the rental fleet).
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
              Sale Products ({products.length})
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
              Sale Categories ({categories.length})
            </button>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212]"
          >
            <Plus className="h-4 w-4" />
            Add Sale Product
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
                placeholder="Search by tool name, SKU, or brand..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-[#F5A623] focus:outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
            >
              <option value="">All Sale Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                  <tr>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Sale Category / Brand</th>
                    <th className="px-4 py-3 text-right">Sale Price</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Loading sale catalog...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No matching sale products found.
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
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-mono">{p.sku}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <p className="font-semibold text-slate-800">
                              {p.category_name || "—"}
                            </p>
                            <p className="text-slate-500">{p.brand_name || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatLKR(getEffectiveSalePrice(p), false)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                stock <= 0
                                  ? "bg-red-100 text-red-700"
                                  : stock <= 5
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
                                href={`/admin/products/${p.id}/edit`}
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
              Add Sale Category
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Drilling & Demolition"
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
                placeholder="Short category summary..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={catSaving}
              className="w-full rounded-xl bg-[#F5A623] py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212]"
            >
              {catSaving ? "Creating..." : "Create Sale Category"}
            </button>
          </form>

          <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Sale Category</th>
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
