"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api-client";
import { loginSchema } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please fill in your credentials.");
      return;
    }

    setLoading(true);
    try {
      const profile = await login(parsed.data.username, parsed.data.password);
      showToast(`Welcome back, ${profile.first_name || profile.username}!`, "success");
      if (profile.role === "ADMIN" && !searchParams.get("redirect")) {
        router.push("/admin/dashboard");
      } else {
        router.push(redirectUrl);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Invalid username or password. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-6">
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
            Sign In to UTD
          </h1>
          <p className="text-sm text-slate-600">
            Access your orders, active equipment rentals, and saved job sites.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john_doe"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm focus:border-[#F5A623] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212] transition-colors disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          New to Universal Tool Depot?{" "}
          <Link
            href={`/register${redirectUrl !== "/account" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-bold text-[#D97706] hover:underline"
          >
            Create a Customer Account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          Protected by JWT Encrypted Session Refresh
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
