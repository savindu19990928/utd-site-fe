"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import type { Brand, Category, Product } from "@/lib/types";

interface ProductEditorFormProps {
  existingProduct?: Product | null;
}

export function ProductEditorForm({ existingProduct }: ProductEditorFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<Product | null>(existingProduct ?? null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: existingProduct?.name ?? "",
    sku: existingProduct?.sku ?? "",
    category: existingProduct?.category ? String(existingProduct.category) : "",
    brand: existingProduct?.brand ? String(existingProduct.brand) : "",
    description: existingProduct?.description ?? "",
    sale_price: existingProduct?.sale_price ?? "",
    rental_price: existingProduct?.rental_price ?? "",
    discount: existingProduct?.discount ?? "0.00",
    stock: String(existingProduct?.stock ?? 10),
    warranty_information: existingProduct?.warranty_information ?? "",
    is_available: existingProduct?.is_available ?? true,
    is_for_sale: existingProduct?.is_for_sale ?? true,
    is_for_rent: existingProduct?.is_for_rent ?? false,
  });

  // Sub-resource draft forms (available once product exists)
  const [variantDraft, setVariantDraft] = useState({
    name: "Packaging",
    value: "",
    sku: "",
    additional_price: "0.00",
    additional_rental_price: "0.00",
    stock: "5",
  });
  const [specDraft, setSpecDraft] = useState({ name: "", value: "" });

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => {});
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  const refreshProduct = async (id: number) => {
    const fresh = await api.getProduct(id);
    setProduct(fresh);
  };

  const handleSaveMain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category ? Number(form.category) : null,
        brand: form.brand ? Number(form.brand) : null,
        description: form.description,
        sale_price: form.is_for_sale && form.sale_price ? form.sale_price : null,
        rental_price: form.is_for_rent && form.rental_price ? form.rental_price : null,
        discount: form.discount || "0.00",
        stock: Number(form.stock) || 0,
        warranty_information: form.warranty_information || null,
        is_available: form.is_available,
        is_for_sale: form.is_for_sale,
        is_for_rent: form.is_for_rent,
      };

      if (product) {
        const updated = await api.updateProduct(product.id, payload);
        setProduct(updated);
        showToast("Product details updated!", "success");
      } else {
        const created = await api.createProduct(payload);
        showToast("Product created! You can now add images, variants, and specs.", "success");
        router.push(`/admin/products/${created.id}/edit`);
      }
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to save product.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async () => {
    if (!product || !variantDraft.value.trim()) return;
    try {
      await api.createVariant({
        product: product.id,
        name: variantDraft.name,
        value: variantDraft.value,
        sku: variantDraft.sku || null,
        additional_price: variantDraft.additional_price || "0.00",
        additional_rental_price: variantDraft.additional_rental_price || "0.00",
        stock: Number(variantDraft.stock) || 0,
        is_active: true,
      });
      setVariantDraft({
        name: "Packaging",
        value: "",
        sku: "",
        additional_price: "0.00",
        additional_rental_price: "0.00",
        stock: "5",
      });
      await refreshProduct(product.id);
      showToast("Variant added.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not add variant.", "error");
    }
  };

  const handleAddSpec = async () => {
    if (!product || !specDraft.name.trim() || !specDraft.value.trim()) return;
    try {
      await api.createSpecification({
        product: product.id,
        name: specDraft.name.trim(),
        value: specDraft.value.trim(),
      });
      setSpecDraft({ name: "", value: "" });
      await refreshProduct(product.id);
      showToast("Specification added.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add spec.", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!product || !file) return;
    const fd = new FormData();
    fd.append("product", String(product.id));
    fd.append("image", file);
    fd.append("is_primary", product.images.length === 0 ? "true" : "false");
    fd.append("display_order", String(product.images.length));
    try {
      await api.uploadProductImage(fd);
      await refreshProduct(product.id);
      showToast("Product image uploaded.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Image upload failed.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        {product && (
          <Link
            href={`/product/${product.id}`}
            className="text-xs font-bold text-[#D97706] hover:underline"
          >
            View Live Store Page &rarr;
          </Link>
        )}
      </div>

      {/* Main Product Form */}
      <form
        onSubmit={handleSaveMain}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
          {product ? `Edit: ${product.name}` : "Create New Equipment"}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">SKU *</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Stock *</label>
            <input
              type="number"
              min={0}
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Description *
          </label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sale Price (LKR)
            </label>
            <input
              type="text"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              placeholder="45000.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Daily Rental (LKR)
            </label>
            <input
              type="text"
              value={form.rental_price}
              onChange={(e) => setForm({ ...form, rental_price: e.target.value })}
              placeholder="2500.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discount (%)
            </label>
            <input
              type="text"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Warranty Info
            </label>
            <input
              type="text"
              value={form.warranty_information}
              onChange={(e) =>
                setForm({ ...form, warranty_information: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-5 pt-1 text-sm font-semibold text-slate-800">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="h-4 w-4 accent-[#F5A623]"
            />
            Active / Available
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_for_sale}
              onChange={(e) => setForm({ ...form, is_for_sale: e.target.checked })}
              className="h-4 w-4 accent-[#F5A623]"
            />
            For Sale
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_for_rent}
              onChange={(e) => setForm({ ...form, is_for_rent: e.target.checked })}
              className="h-4 w-4 accent-[#EA580C]"
            />
            For Rent
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212]"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : product ? "Save Product Changes" : "Create Product"}
        </button>
      </form>

      {/* Media, Variants & Specifications Panels (Available when editing) */}
      {product && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Product Photos</h2>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                <Upload className="h-3.5 w-3.5" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleImageUpload(e)}
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden group"
                >
                  <Image
                    src={img.image}
                    alt={product.name}
                    fill
                    sizes="120px"
                    className="object-contain p-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteProductImage(img.id);
                      await refreshProduct(product.id);
                    }}
                    className="absolute right-1 top-1 rounded bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Product Variants</h2>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Dimension (e.g. Size)"
                value={variantDraft.name}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, name: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Option (e.g. 2x Batteries)"
                value={variantDraft.value}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, value: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Variant SKU"
                value={variantDraft.sku}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, sku: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
              />
              <input
                type="text"
                placeholder="+Sale Price"
                value={variantDraft.additional_price}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, additional_price: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="number"
                placeholder="Stock"
                value={variantDraft.stock}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, stock: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => void handleAddVariant()}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Variant
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2">
                  <span>
                    <strong>
                      {v.name}: {v.value}
                    </strong>{" "}
                    ({v.sku}) &bull; Stock: {v.stock}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteVariant(v.id);
                      await refreshProduct(product.id);
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Technical Specs</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec (e.g. Power)"
                value={specDraft.name}
                onChange={(e) => setSpecDraft({ ...specDraft, name: e.target.value })}
                className="w-1/3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Value (e.g. 900W)"
                value={specDraft.value}
                onChange={(e) => setSpecDraft({ ...specDraft, value: e.target.value })}
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => void handleAddSpec()}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
              >
                Add
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {product.specifications.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2">
                  <span>
                    <strong>{s.name}:</strong> {s.value}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteSpecification(s.id);
                      await refreshProduct(product.id);
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
