"use client";

import React, { useState } from "react";
import {
  Building2,
  Check,
  Copy,
  CreditCard,
  Sparkles,
  Upload,
} from "lucide-react";
import { formatLKR } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  totalAmount: number;
  bankSlipName?: string;
  onBankSlipChange?: (fileName: string) => void;
  bankRefNote?: string;
  onBankRefNoteChange?: (val: string) => void;
}

const BANK_DETAILS = [
  { label: "Bank", value: "Commercial Bank of Ceylon" },
  { label: "Account Name", value: "Universal Tool Depot (Pvt) Ltd" },
  { label: "Account Number", value: "1000 8923 4510" },
  { label: "Branch", value: "Colombo 03 / Corporate Branch" },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  totalAmount,
  bankSlipName,
  onBankSlipChange,
  bankRefNote,
  onBankRefNoteChange,
}: PaymentMethodSelectorProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const installment = Math.round((totalAmount / 3) * 100) / 100;

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-3">
      {/* Koko BNPL */}
      <label
        className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
          selected === "KOKO"
            ? "border-[#F5A623] bg-amber-50/70 ring-2 ring-amber-400/25"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <input
          type="radio"
          name="payment_method"
          value="KOKO"
          checked={selected === "KOKO"}
          onChange={() => onSelect("KOKO")}
          className="mt-1 h-4 w-4 accent-[#F5A623]"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
              Koko (Buy Now Pay Later)
              <span className="rounded bg-pink-100 px-2 py-0.5 text-[10px] font-extrabold text-pink-700">
                KOKO 3x
              </span>
            </span>
            <Sparkles className="h-4 w-4 text-pink-600" />
          </div>
          <p className="mt-1 text-xs font-medium text-slate-700">
            Pay 3 interest-free installments of{" "}
            <strong className="text-slate-950">{formatLKR(installment)}</strong> with Koko.
          </p>
        </div>
      </label>

      {/* Mintpay */}
      <label
        className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
          selected === "MINTPAY"
            ? "border-[#F5A623] bg-amber-50/70 ring-2 ring-amber-400/25"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <input
          type="radio"
          name="payment_method"
          value="MINTPAY"
          checked={selected === "MINTPAY"}
          onChange={() => onSelect("MINTPAY")}
          className="mt-1 h-4 w-4 accent-[#F5A623]"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
              Mintpay
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                3 INSTALLMENTS
              </span>
            </span>
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-1 text-xs font-medium text-slate-700">
            Split into 3 easy debit/credit card payments of{" "}
            <strong className="text-slate-950">{formatLKR(installment)}</strong>.
          </p>
        </div>
      </label>

      {/* Direct Bank Transfer */}
      <div
        className={`rounded-xl border transition-all ${
          selected === "BANK_TRANSFER"
            ? "border-[#F5A623] bg-amber-50/50 ring-2 ring-amber-400/25"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <label className="flex cursor-pointer items-start gap-3.5 p-4">
          <input
            type="radio"
            name="payment_method"
            value="BANK_TRANSFER"
            checked={selected === "BANK_TRANSFER"}
            onChange={() => onSelect("BANK_TRANSFER")}
            className="mt-1 h-4 w-4 accent-[#F5A623]"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-950">
                Direct Bank Payment (Wire / Online Banking)
              </span>
              <Building2 className="h-4 w-4 text-slate-700" />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Transfer directly to our Commercial Bank corporate account and upload your transfer receipt.
            </p>
          </div>
        </label>

        {selected === "BANK_TRANSFER" && (
          <div className="border-t border-amber-200 bg-white p-4 rounded-b-xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Verified Company Bank Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BANK_DETAILS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyValue(item.label, item.value)}
                      aria-label={`Copy ${item.label}`}
                      className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-[#D97706]"
                    >
                      {copiedField === item.label ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              Please transfer the exact amount of{" "}
              <strong>{formatLKR(totalAmount)}</strong> and quote your Order/Rental Reference Number as the transfer remark. Your order will be confirmed once verified by our accounts team.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onBankRefNoteChange && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer Reference / Remark (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankRefNote || ""}
                    onChange={(e) => onBankRefNoteChange(e.target.value)}
                    placeholder="e.g. CEFT-8839201"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#F5A623] focus:outline-none"
                  />
                </div>
              )}
              {onBankSlipChange && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload Bank Slip / Proof of Payment
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#F5A623]">
                    <span className="truncate">
                      {bankSlipName || "Choose PDF or JPG/PNG slip"}
                    </span>
                    <Upload className="h-4 w-4 shrink-0 text-[#D97706]" />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onBankSlipChange(file.name);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
