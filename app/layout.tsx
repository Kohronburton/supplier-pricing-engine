import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supplier Pricing Engine",
  description:
    "Configurable CPQ reference implementation for supplier-specific pricing and quoting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
