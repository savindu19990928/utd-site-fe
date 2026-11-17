"use client";

import React from "react";
import type { Product } from "@/lib/types";
import { AuthProvider } from "./AuthProvider";
import { StoreProvider } from "./StoreProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({
  children,
  initialProducts,
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
}) {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider initialProducts={initialProducts}>{children}</StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
