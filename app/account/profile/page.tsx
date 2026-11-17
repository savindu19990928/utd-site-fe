"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api, ApiError } from "@/lib/api-client";
import type { UserProfile } from "@/lib/types";
import { profileUpdateSchema } from "@/lib/validation";

function ProfileEditorForm({ user }: { user: UserProfile | null }) {
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    mobile_number: user?.mobile_number || "",
    nic: user?.nic || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = profileUpdateSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateProfile({
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        mobile_number: parsed.data.mobile_number || null,
        nic: parsed.data.nic || null,
      });
      setUser(updated);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not update profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
          My Profile
        </h1>
        <p className="text-sm text-slate-500">
          Maintain your Sri Lankan mobile number and NIC for instant rental verification.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username (Read-Only)
            </label>
            <input
              type="text"
              readOnly
              value={user?.username || ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Role
            </label>
            <input
              type="text"
              readOnly
              value={user?.role || "CUSTOMER"}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-mono text-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (07XXXXXXXX)
            </label>
            <input
              type="tel"
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              placeholder="0771234567"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
            />
            {errors.mobile_number && (
              <p className="mt-1 text-xs text-red-600">{errors.mobile_number}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              National Identity Card (NIC)
            </label>
            <input
              type="text"
              value={form.nic}
              onChange={(e) => setForm({ ...form, nic: e.target.value })}
              placeholder="199012345678 or 901234567V"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm focus:border-[#F5A623] focus:outline-none"
            />
            {errors.nic && <p className="mt-1 text-xs text-red-600">{errors.nic}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Profile Changes"}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return <ProfileEditorForm key={user?.id ?? "guest"} user={user} />;
}
