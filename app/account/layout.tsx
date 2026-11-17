"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/account")}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
        Loading customer portal...
      </div>
    );
  }

  const links = [
    { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/account/profile", label: "My Profile", icon: User },
    { href: "/account/addresses", label: "My Addresses", icon: MapPin },
    { href: "/account/orders", label: "Order History", icon: Package },
    { href: "/account/rentals", label: "Rental Bookings", icon: CalendarClock },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div className="bg-[#F8FAFC] py-8 flex-1">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs no-print">
            <div className="mb-4 border-b border-slate-100 pb-4 px-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Portal
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>

            <nav className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-amber-50 text-amber-950 border border-amber-200"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? "text-[#D97706]" : "text-slate-500"}`}
                    />
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
