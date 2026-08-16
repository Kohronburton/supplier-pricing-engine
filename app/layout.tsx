import type { Metadata } from "next";
import "./globals.css";
import "./v3.css";
import "./v4.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cpq.kohronburton.com"),
  title: "Supplier Pricing Engine | CPQ Demo by Kohron Burton",
  description:
    "A live CPQ reference implementation for supplier-specific product rules, price grids, compatibility, freight, margins, professional quotes, and explainable pricing.",
  applicationName: "Supplier Pricing Engine",
  authors: [{ name: "Kohron Burton", url: "https://kohronburton.com" }],
  creator: "Kohron Burton",
  keywords: [
    "CPQ",
    "Configure Price Quote",
    "pricing engine",
    "supplier pricing",
    "rule engine",
    "Next.js",
    "TypeScript",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Supplier Pricing Engine | Live CPQ Demo",
    description:
      "Different supplier rules. One deterministic pricing engine. Configure, validate, price, save, and export a professional quote.",
    url: "https://cpq.kohronburton.com",
    siteName: "Supplier Pricing Engine",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Supplier Pricing Engine CPQ reference implementation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supplier Pricing Engine | Live CPQ Demo",
    description:
      "A deterministic, explainable CPQ pricing engine for complex supplier rules.",
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
