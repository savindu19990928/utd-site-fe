"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api-client";
import { registerSchema } from "@/lib/validation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register(parsed.data);
      showToast("Account created! Welcome to Universal Tool Depot.", "success");
      router.push(redirectUrl);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not complete registration. Please check your details.";
      setApiError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Image
              src="/images/utd-logo-clean.jpg"
              alt="Universal Tool Depot"
              width={150}
              height={50}
              className="mx-auto h-12 w-auto object-contain"
            />
          </Link>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Create Contractor Account
          </h1>
          <p className="text-sm text-slate-600">
            Register once to purchase tools, book machinery rentals, and track site deliveries.
          </p>
        </div>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {fieldErrors.first_name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.first_name}</p>
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
              {fieldErrors.last_name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="kasun_builder"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kasun@example.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password (min 8 chars) *
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm focus:border-[#F5A623] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={form.password_confirm}
                onChange={(e) =>
                  setForm({ ...form, password_confirm: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
              />
              {fieldErrors.password_confirm && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.password_confirm}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212] transition-colors disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating Account..." : "Register Account"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#D97706] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500">
          Loading registration...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
