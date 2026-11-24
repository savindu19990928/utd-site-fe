"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, Plus, Save, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import { getOrderStatusBadgeClasses } from "@/lib/format";
import type {
  Brand,
  RentalCategory,
  RentalMachine,
  RentalMachineStatus,
  RentalProduct,
} from "@/lib/types";

interface RentalProductEditorFormProps {
  existingProduct?: RentalProduct | null;
}

function parseMachineNumberList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];
}

export function RentalProductEditorForm({
  existingProduct,
}: RentalProductEditorFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<RentalProduct | null>(
    existingProduct ?? null
  );
  const [machines, setMachines] = useState<RentalMachine[]>(
    existingProduct?.machines ?? []
  );
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: existingProduct?.name ?? "",
    sku: existingProduct?.sku ?? "",
    category: existingProduct?.category ? String(existingProduct.category) : "",
    brand: existingProduct?.brand ? String(existingProduct.brand) : "",
    description: existingProduct?.description ?? "",
    rental_price: existingProduct?.rental_price ?? "",
    discount: existingProduct?.discount ?? "0.00",
    stock: String(existingProduct?.stock ?? 10),
    warranty_information:
      existingProduct?.warranty_information ?? "Rental Fleet Inspected",
    is_available: existingProduct?.is_available ?? true,
    has_machine_numbers: existingProduct?.has_machine_numbers ?? false,
    initial_machine_numbers: "",
  });

  // Machine management drafts (when editing)
  const [singleMachineNumber, setSingleMachineNumber] = useState("");
  const [bulkMachineNumbers, setBulkMachineNumbers] = useState("");
  const [machineBusy, setMachineBusy] = useState(false);

  // Sub-resource drafts
  const [variantDraft, setVariantDraft] = useState({
    name: "Packaging",
    value: "",
    sku: "",
    additional_rental_price: "0.00",
    stock: "5",
  });
  const [specDraft, setSpecDraft] = useState({ name: "", value: "" });

  const loadMachines = useCallback(async (rentalProductId: number) => {
    try {
      const list = await api.listRentalMachines({
        rental_product: rentalProductId,
      });
      setMachines(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    api.listRentalCategories().then(setCategories).catch(() => {});
    api.listBrands().then(setBrands).catch(() => {});
    if (existingProduct?.id && existingProduct.has_machine_numbers) {
      api
        .listRentalMachines({ rental_product: existingProduct.id })
        .then((list) => setMachines(Array.isArray(list) ? list : []))
        .catch(() => {});
    }
  }, [existingProduct]);

  const refreshProduct = async (id: number) => {
    const fresh = await api.getRentalProduct(id, { auth: true });
    setProduct(fresh);
    if (fresh.has_machine_numbers) {
      await loadMachines(id);
    }
  };

  const handleSaveMain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedMachines = form.has_machine_numbers
        ? parseMachineNumberList(form.initial_machine_numbers)
        : [];

      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category ? Number(form.category) : null,
        brand: form.brand ? Number(form.brand) : null,
        description: form.description,
        rental_price: form.rental_price || "0.00",
        discount: form.discount || "0.00",
        stock: form.has_machine_numbers ? 0 : Number(form.stock) || 0,
        has_machine_numbers: form.has_machine_numbers,
        warranty_information: form.warranty_information || null,
        is_available: form.is_available,
        ...(parsedMachines.length > 0 ? { machine_numbers: parsedMachines } : {}),
      };

      if (product) {
        const updated = await api.updateRentalProduct(product.id, payload);
        setProduct(updated);
        setForm((prev) => ({ ...prev, initial_machine_numbers: "" }));
        if (updated.has_machine_numbers) {
          await loadMachines(updated.id);
        }
        showToast("Rental equipment updated!", "success");
      } else {
        const created = await api.createRentalProduct(payload);
        showToast(
          "Rental equipment created! Add images, specs, or machine numbers below.",
          "success"
        );
        router.push(`/admin/rental-products/${created.id}/edit`);
      }
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Failed to save rental equipment.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddSingleMachine = async () => {
    if (!product || !singleMachineNumber.trim()) return;
    setMachineBusy(true);
    try {
      await api.createRentalMachine({
        rental_product: product.id,
        machine_number: singleMachineNumber.trim(),
        status: "AVAILABLE",
      });
      setSingleMachineNumber("");
      await refreshProduct(product.id);
      showToast("Machine number added.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not add machine.",
        "error"
      );
    } finally {
      setMachineBusy(false);
    }
  };

  const handleBulkCreateMachines = async () => {
    if (!product) return;
    const numbers = parseMachineNumberList(bulkMachineNumbers);
    if (numbers.length === 0) {
      showToast("Enter at least one machine number (comma or newline separated).", "warning");
      return;
    }
    setMachineBusy(true);
    try {
      await api.bulkCreateRentalMachines({
        rental_product: product.id,
        variant: null,
        machine_numbers: numbers,
        status: "AVAILABLE",
      });
      setBulkMachineNumbers("");
      await refreshProduct(product.id);
      showToast(`Added ${numbers.length} machine numbers.`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Bulk machine creation failed.",
        "error"
      );
    } finally {
      setMachineBusy(false);
    }
  };

  const handleUpdateMachineStatus = async (
    machine: RentalMachine,
    status: RentalMachineStatus
  ) => {
    if (!product) return;
    try {
      await api.updateRentalMachine(machine.id, { status });
      await refreshProduct(product.id);
      showToast(`${machine.machine_number} set to ${status}.`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Status update failed.",
        "error"
      );
    }
  };

  const handleDeleteMachine = async (machine: RentalMachine) => {
    if (!product) return;
    if (!window.confirm(`Remove machine number "${machine.machine_number}"?`)) return;
    try {
      await api.deleteRentalMachine(machine.id);
      await refreshProduct(product.id);
      showToast(`Removed ${machine.machine_number}.`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete machine.",
        "error"
      );
    }
  };

  const handleAddVariant = async () => {
    if (!product || !variantDraft.value.trim()) return;
    try {
      await api.createRentalVariant({
        rental_product: product.id,
        name: variantDraft.name,
        value: variantDraft.value,
        sku: variantDraft.sku || null,
        additional_rental_price: variantDraft.additional_rental_price || "0.00",
        stock: Number(variantDraft.stock) || 0,
        is_active: true,
      });
      setVariantDraft({
        name: "Packaging",
        value: "",
        sku: "",
        additional_rental_price: "0.00",
        stock: "5",
      });
      await refreshProduct(product.id);
      showToast("Rental variant added.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not add rental variant.",
        "error"
      );
    }
  };

  const handleAddSpec = async () => {
    if (!product || !specDraft.name.trim() || !specDraft.value.trim()) return;
    try {
      await api.createRentalSpecification({
        rental_product: product.id,
        name: specDraft.name.trim(),
        value: specDraft.value.trim(),
      });
      setSpecDraft({ name: "", value: "" });
      await refreshProduct(product.id);
      showToast("Rental specification added.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to add spec.",
        "error"
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!product || !file) return;
    const fd = new FormData();
    fd.append("rental_product", String(product.id));
    fd.append("image", file);
    fd.append("is_primary", product.images.length === 0 ? "true" : "false");
    fd.append("display_order", String(product.images.length));
    try {
      await api.uploadRentalProductImage(fd);
      await refreshProduct(product.id);
      showToast("Rental image uploaded.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Image upload failed.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/rental-products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rental Catalog
        </Link>
        {product && (
          <Link
            href={`/rentals/${product.id}`}
            className="text-xs font-bold text-[#EA580C] hover:underline"
          >
            View Live Rental Page &rarr;
          </Link>
        )}
      </div>

      {/* Main Rental Product Form */}
      <form
        onSubmit={handleSaveMain}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
          {product
            ? `Edit Rental Equipment: ${product.name}`
            : "Create New Rental Equipment"}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Equipment Name *
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
              Rental Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select Rental Category</option>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Daily Rental Rate (LKR) *
            </label>
            <input
              type="text"
              required
              value={form.rental_price}
              onChange={(e) => setForm({ ...form, rental_price: e.target.value })}
              placeholder="3500.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
            />
          </div>
        </div>

        {/* Tracking Mode Selector: Default No Machine Numbers vs Individual Machine Numbers */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Inventory Tracking Mode
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                !form.has_machine_numbers
                  ? "border-[#EA580C] bg-orange-50/70 ring-1 ring-orange-300"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="tracking_mode"
                  checked={!form.has_machine_numbers}
                  onChange={() =>
                    setForm({ ...form, has_machine_numbers: false })
                  }
                  className="mt-1 accent-[#EA580C]"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Bulk Stock Only (Default — No Machine Numbers)
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Tracked purely by total quantity (e.g., 60 scaffolding clamps).
                  </p>
                </div>
              </div>
            </label>

            <label
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                form.has_machine_numbers
                  ? "border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-300"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="tracking_mode"
                  checked={form.has_machine_numbers}
                  onChange={() =>
                    setForm({ ...form, has_machine_numbers: true })
                  }
                  className="mt-1 accent-indigo-600"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Machine-Numbered Assets (Letters + Numbers)
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Each unit carries a unique fleet ID (e.g., RFP-0001, RFP-0002).
                  </p>
                </div>
              </div>
            </label>
          </div>

          {!form.has_machine_numbers ? (
            <div className="max-w-xs">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bulk Fleet Stock Quantity *
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
              />
            </div>
          ) : !product ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Machine Numbers (comma or newline separated)
              </label>
              <textarea
                rows={3}
                value={form.initial_machine_numbers}
                onChange={(e) =>
                  setForm({ ...form, initial_machine_numbers: e.target.value })
                }
                placeholder={"RFP-0001\nRFP-0002\nRFP-0003"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
              />
            </div>
          ) : (
            <p className="text-xs font-semibold text-indigo-900">
              Currently tracked via {machines.length} registered machine numbers (Available stock: {product.available_stock}). Manage individual machine IDs in the panel below.
            </p>
          )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Fleet Inspection / Warranty Note
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
              className="h-4 w-4 accent-[#EA580C]"
            />
            Active / Available for Rent
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-6 py-3 text-sm font-extrabold text-white hover:bg-orange-700"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Saving..."
            : product
            ? "Save Rental Equipment"
            : "Create Rental Equipment"}
        </button>
      </form>

      {/* Machine Numbers Management Panel */}
      {product && product.has_machine_numbers && (
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-700" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Registered Machine Numbers ({machines.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Alphanumeric IDs supported (e.g., RFP-0001)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-800">Add Single Machine</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={singleMachineNumber}
                  onChange={(e) => setSingleMachineNumber(e.target.value)}
                  placeholder="RFP-0004"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={machineBusy}
                  onClick={() => void handleAddSingleMachine()}
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Bulk Add Machine Numbers (comma or newline separated)
              </p>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={bulkMachineNumbers}
                  onChange={(e) => setBulkMachineNumbers(e.target.value)}
                  placeholder="RFP-0005, RFP-0006, RFP-0007"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={machineBusy}
                  onClick={() => void handleBulkCreateMachines()}
                  className="rounded-lg bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  Bulk Add
                </button>
              </div>
            </div>
          </div>

          {machines.length === 0 ? (
            <p className="text-xs text-slate-500">
              No machine numbers registered yet. Add individual or bulk machine numbers above.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-left uppercase text-white">
                  <tr>
                    <th className="px-4 py-2.5">Machine Number</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {machines.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-950">
                        {m.machine_number}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getOrderStatusBadgeClasses(
                            m.status
                          )}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <select
                          value={m.status}
                          onChange={(e) =>
                            void handleUpdateMachineStatus(
                              m,
                              e.target.value as RentalMachineStatus
                            )
                          }
                          aria-label={`Change status for ${m.machine_number}`}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="RETIRED">RETIRED</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleDeleteMachine(m)}
                          aria-label={`Delete ${m.machine_number}`}
                          className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50 align-middle"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rental Media, Variants & Specifications Panels */}
      {product && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Rental Photos</h2>
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
                      await api.deleteRentalProductImage(img.id);
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Rental Variants</h2>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Dimension (e.g. Packaging)"
                value={variantDraft.name}
                onChange={(e) =>
                  setVariantDraft({ ...variantDraft, name: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Option (e.g. Carry Case)"
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
                placeholder="+Daily Rent (LKR)"
                value={variantDraft.additional_rental_price}
                onChange={(e) =>
                  setVariantDraft({
                    ...variantDraft,
                    additional_rental_price: e.target.value,
                  })
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
                    ({v.sku}) &bull; Stock: {v.available_stock ?? v.stock}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteRentalVariant(v.id);
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Technical Specs</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec (e.g. Motor Power)"
                value={specDraft.name}
                onChange={(e) => setSpecDraft({ ...specDraft, name: e.target.value })}
                className="w-1/3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Value (e.g. 1500W)"
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
                      await api.deleteRentalSpecification(s.id);
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
