import type { Metadata } from "next";
import QuoteStudio from "@/app/components/quote-studio";

export const metadata: Metadata = {
  title: "Live Quote Studio | Supplier Pricing Engine",
  description:
    "Interactive multi-line CPQ demo with supplier rules, product configuration, margin guardrails, quote approvals, PDF output, and pricing provenance.",
  alternates: {
    canonical: "/demo",
  },
};

export default function DemoPage() {
  return <QuoteStudio />;
}
