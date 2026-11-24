"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RentalProductEditorForm } from "@/components/admin/RentalProductEditorForm";
import { api } from "@/lib/api-client";
import type { RentalProduct } from "@/lib/types";

export default function EditRentalProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<RentalProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRentalProduct(params.id, { auth: true })
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading rental equipment editor...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-red-600 font-bold">
        Rental product #{params.id} not found.
      </div>
    );
  }

  return <RentalProductEditorForm existingProduct={product} />;
}
