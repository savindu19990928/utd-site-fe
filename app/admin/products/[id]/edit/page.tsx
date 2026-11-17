"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { api } from "@/lib/api-client";
import type { Product } from "@/lib/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProduct(params.id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading product editor...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-red-600 font-bold">
        Product #{params.id} not found.
      </div>
    );
  }

  return <ProductEditorForm existingProduct={product} />;
}
