"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageSquareCheck,
  Package,
  ShoppingBag,
  Store,
  Tag,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sale Catalog", icon: Wrench },
  { href: "/admin/rental-products", label: "Rental Catalog", icon: CalendarClock },
  { href: "/admin/orders", label: "Sales Orders", icon: ShoppingBag },
  { href: "/admin/rentals", label: "Rental Bookings", icon: Package },
  { href: "/admin/payments", label: "Payments & Bank Slips", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons & Promos", icon: Tag },
  { href: "/admin/reviews", label: "Review Moderation", icon: MessageSquareCheck },
  { href: "/admin/reports", label: "Reports & Exports", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/admin/dashboard")}`);
      return;
    }
    if (!isAdmin) {
      showToast("Administrator permissions are required to access the Operations Portal.", "error");
      router.replace("/account");
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router, showToast]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-slate-500">
        Verifying operations permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-[#F8FAFC]">
      {/* Dark Collapsible Industrial Sidebar */}
      <aside
        className={`no-print bg-[#0F172A] text-slate-300 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between shrink-0 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-2">
            {!collapsed && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5A623]">
                  UDT Operations
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {user?.first_name || user?.username}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle admin sidebar"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#F5A623] text-zinc-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800">
          <Link
            href="/catalog"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Store className="h-4 w-4 shrink-0" />
            {!collapsed && <span>View Storefront</span>}
          </Link>
          <Link
            href="/account"
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Package className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Customer Portal</span>}
          </Link>
        </div>
      </aside>

      {/* Main Operations Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
