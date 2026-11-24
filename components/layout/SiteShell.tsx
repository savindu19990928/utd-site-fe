import React from "react";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedProducts,
  getCachedRentalCategories,
  getCachedRentalProducts,
} from "@/lib/catalog-server";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AppProviders } from "@/components/providers/AppProviders";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [categories, rentalCategories, brands, products, rentalProducts] =
    await Promise.all([
      getCachedCategories(),
      getCachedRentalCategories(),
      getCachedBrands(),
      getCachedProducts(),
      getCachedRentalProducts(),
    ]);

  return (
    <AppProviders
      initialProducts={products}
      initialRentalProducts={rentalProducts}
    >
      <Header
        categories={categories}
        rentalCategories={rentalCategories}
        brands={brands}
        products={products}
        rentalProducts={rentalProducts}
      />
      <CartDrawer />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer categories={categories} rentalCategories={rentalCategories} />
    </AppProviders>
  );
}
