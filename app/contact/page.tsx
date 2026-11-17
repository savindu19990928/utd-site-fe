"use client";

import React, { useState } from "react";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { useToast } from "@/components/providers/ToastProvider";

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Equipment Sales & Rental Inquiry");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      showToast("Please enter your name and inquiry details.", "warning");
      return;
    }
    setSubmitted(true);
    showToast("Thank you! Our Colombo dispatch desk has received your inquiry.", "success");
  };

  return (
    <div className="flex flex-col bg-[#F8FAFC]">
      {/* Banner */}
      <section className="bg-[#141414] text-white py-10 border-b border-zinc-800">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
            24/7 Support &amp; Islandwide Dispatch
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold">
            Contact <span className="text-[#F5A623]">Universal Tool Depot</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
            Reach our engineering and logistics team for bulk tool quotes, fleet availability checks, or job-site breakdown support.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Info + Branch Map */}
        <div className="lg:col-span-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-4">
              <div className="rounded-lg bg-amber-100 p-2.5 text-[#D97706]">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Hotline &amp; Dispatch</h2>
                <a href="tel:+94706611936" className="text-base font-extrabold text-slate-950 hover:text-[#D97706]">
                  +94 706 611 936
                </a>
                <p className="text-xs text-slate-500 mt-0.5">Direct engineering &amp; order support</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-4">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">WhatsApp Site Desk</h2>
                <a
                  href="https://wa.me/94706611936"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-emerald-700 hover:underline"
                >
                  Chat on WhatsApp (+94 706 611 936)
                </a>
                <p className="text-xs text-slate-500 mt-0.5">Send bank slips or site pins quickly</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-4">
              <div className="rounded-lg bg-slate-100 p-2.5 text-slate-800">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Email &amp; Corporate Quotes</h2>
                <a
                  href="mailto:support@universaltooldepot.lk"
                  className="text-sm font-bold text-slate-900 hover:text-[#D97706]"
                >
                  support@universaltooldepot.lk
                </a>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Mon - Sat: 8:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#EA580C]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Colombo 03 Flagship Showroom &amp; Rental Yard
                </h2>
                <p className="text-xs text-slate-600">
                  No. 452, Galle Road, Colombo 03, Western Province, Sri Lanka
                </p>
              </div>
            </div>
            <LocationPicker
              value="6.9061, 79.8529"
              onChange={() => {}}
              readOnly
              initialLat={6.9061}
              initialLng={79.8529}
              heightClass="h-60"
            />
          </div>
        </div>

        {/* Right Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Send an Inquiry or Request a Site Quote
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Need multiple machines for a multi-week construction project? Let us know your schedule and job site location.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
                <p className="text-lg font-bold text-emerald-900">
                  Inquiry Received — Reference #{Math.floor(100000 + (name.length * 1379) % 899999)}
                </p>
                <p className="text-sm text-emerald-800">
                  Thank you, {name}. A Universal Tool Depot specialist will contact you shortly on {mobile || email || "your provided contact"}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Kamal Perera"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (07X XXX XXXX)
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="0771234567"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kamal@contractor.lk"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                    >
                      <option>Equipment Sales &amp; Rental Inquiry</option>
                      <option>Bulk Corporate / Contractor Quote</option>
                      <option>Order or Bank Transfer Verification</option>
                      <option>Breakdown Replacement Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Message &amp; Tool / Site Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="List the equipment SKUs, rental dates, or technical questions..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] px-6 py-3 text-sm font-extrabold text-zinc-950 hover:bg-[#e09212] transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
