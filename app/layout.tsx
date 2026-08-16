import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import "./v5.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cpq.kohronburton.com"),
  title: "Supplier Pricing Engine | CPQ Architecture Case Study",
  description:
    "A working CPQ architecture case study showing deterministic supplier pricing, versioned rules, compatibility validation, multi-line quoting, margin guardrails, and explainable pricing.",
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
    title: "Supplier Pricing Engine | CPQ Architecture Case Study",
    description:
      "Different supplier rulebooks. One deterministic quoting workflow. See the architecture decisions, executable proof, and live multi-line CPQ demo.",
    url: "https://cpq.kohronburton.com",
    siteName: "Supplier Pricing Engine",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Supplier Pricing Engine CPQ architecture case study",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supplier Pricing Engine | CPQ Architecture Case Study",
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
