import type { Metadata } from "next";
import "./globals.css";
import "./v3.css";

export const metadata: Metadata = {
  title: "Supplier Pricing Engine V3",
  description:
    "Simple, explainable CPQ demo for supplier-specific pricing rules, product validation, margins, and quoting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
