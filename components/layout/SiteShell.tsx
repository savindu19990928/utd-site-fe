import React from "react";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedProducts,
} from "@/lib/catalog-server";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AppProviders } from "@/components/providers/AppProviders";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [categories, brands, products] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getCachedProducts(),
  ]);

  return (
    <AppProviders initialProducts={products}>
      <Header categories={categories} brands={brands} products={products} />
      <CartDrawer />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer categories={categories} />
    </AppProviders>
  );
}
