import type { Metadata } from "next";
import { Suspense } from "react";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Universal Tool Depot | Heavy Construction Equipment Sales & Rental Sri Lanka",
    template: "%s | Universal Tool Depot",
  },
  description:
    "Universal Tool Depot (UDT) is Sri Lanka's digital marketplace for contractor-grade power tools, industrial machinery sales, and instant islandwide equipment rentals.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F5A623]" />
            </div>
          }
        >
          <SiteShell>{children}</SiteShell>
        </Suspense>
      </body>
    </html>
  );
}
