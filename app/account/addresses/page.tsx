"use client";

import React, { useEffect, useState } from "react";
import { Edit2, MapPin, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import type { Address } from "@/lib/types";
import { addressSchema } from "@/lib/validation";

const EMPTY_FORM = {
  title: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  is_default: false,
};

export default function AddressesPage() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const refreshAddresses = async () => {
    try {
      const list = await api.listAddresses();
      setAddresses(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .listAddresses()
      .then((list) => {
        if (active) setAddresses(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      title: addr.title,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Invalid address fields.", "error");
      return;
    }

    try {
      if (editingId) {
        await api.updateAddress(editingId, parsed.data);
        showToast("Address updated.", "success");
      } else {
        await api.createAddress(parsed.data);
        showToast("Address added.", "success");
      }
      setModalOpen(false);
      await refreshAddresses();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to save address.",
        "error"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast("Address deleted.", "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete address.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            My Saved Addresses
          </h1>
          <p className="text-sm text-slate-500">
            Manage delivery depots, homes, and active job sites across Sri Lanka.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-[#e09212]"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No saved delivery addresses yet</p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 rounded-lg bg-[#F5A623] px-5 py-2 text-xs font-bold text-zinc-950"
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-base font-bold text-slate-900">{addr.title}</span>
                  {addr.is_default && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{addr.address_line_1}</p>
                {addr.address_line_2 && (
                  <p className="text-sm text-slate-600">{addr.address_line_2}</p>
                )}
                <p className="text-sm text-slate-500">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(addr.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                {editingId ? "Edit Address" : "Add Delivery Address"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title (e.g. Home, Site Office) *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={form.address_line_1}
                  onChange={(e) => setForm({ ...form, address_line_1: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={form.address_line_2}
                  onChange={(e) => setForm({ ...form, address_line_2: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="h-4 w-4 accent-[#F5A623]"
                />
                Set as default delivery address
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F5A623] px-5 py-2 text-xs font-extrabold text-zinc-950"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
