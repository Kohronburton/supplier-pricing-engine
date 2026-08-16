import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import "./v6-landing.css";
import "./v5.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cpq.kohronburton.com"),
  title: "Supplier Pricing Engine | Quote Complex Catalogs Without Spreadsheet Pricing",
  description:
    "A working CPQ case study and live demo for supplier-specific price books, validation, freight, margin guardrails, multi-line quotes, and explainable pricing.",
  applicationName: "Supplier Pricing Engine",
  authors: [{ name: "Kohron Burton", url: "https://kohronburton.com" }],
  creator: "Kohron Burton",
  keywords: [
    "CPQ",
    "Configure Price Quote",
    "pricing engine",
    "supplier pricing",
    "rule engine",
    "quote automation",
    "Next.js",
    "TypeScript",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Quote Complex Supplier Catalogs Without Spreadsheet Pricing",
    description:
      "One guided quote workflow for different supplier rulebooks—with deterministic pricing, executable tests, margin controls, and a visible audit trail.",
    url: "https://cpq.kohronburton.com",
    siteName: "Supplier Pricing Engine",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Supplier Pricing Engine CPQ case study and live quote demo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quote Complex Supplier Catalogs Without Spreadsheet Pricing",
    description:
      "A deterministic, explainable CPQ pricing engine with a live multi-line quote studio.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
