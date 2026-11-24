"use client";

import React from "react";
import type { Product, RentalProduct } from "@/lib/types";
import { AuthProvider } from "./AuthProvider";
import { StoreProvider } from "./StoreProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({
  children,
  initialProducts,
  initialRentalProducts,
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
  initialRentalProducts?: RentalProduct[];
}) {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider
          initialProducts={initialProducts}
          initialRentalProducts={initialRentalProducts}
        >
          {children}
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
