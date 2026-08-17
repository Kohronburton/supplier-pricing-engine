import type { Metadata } from "next";
import QuoteStudio from "@/app/components/quote-studio";
import { calculateQuote } from "@/src/engine/pricing-engine";

export const metadata: Metadata = {
  title: "Live CPQ Demo | Quote Complex Supplier Catalogs in Seconds",
  description:
    "See a deterministic CPQ engine quote complex supplier catalogs, block invalid configurations, protect margin, and preserve an audit trail without spreadsheet pricing.",
  alternates: {
    canonical: "/demo",
  },
};

const site = "https://cpq.kohronburton.com";

const initialQuote = calculateQuote({
  supplier: "alpha",
  product: "roller-shade",
  width: 73.25,
  height: 80.1,
  fabric: "premium",
  controlType: "motorized",
  options: ["cassette"],
  targetMargin: 0.38,
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function DemoPage() {
  return (
    <>
      <main className="v6-demo-shell">
        <nav className="v6-demo-nav">
          <a href={site} className="v6-demo-brand">
            <span>SP</span>
            <div>
              <strong>Supplier Pricing Engine</strong>
              <small>Live CPQ proof</small>
            </div>
          </a>
          <div>
            <a href={site}>Read case study</a>
            <a href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">Source ↗</a>
            <a className="v6-contact-link" href="https://kohronburton.com" target="_blank" rel="noreferrer">Need this? Contact →</a>
          </div>
        </nav>

        <header className="v6-demo-hero">
          <div className="v6-demo-copy">
            <span className="v6-kicker">LIVE CPQ DEMO</span>
            <h1>Quote complex supplier catalogs in seconds—without spreadsheets or pricing guesswork.</h1>
            <p>
              One sales workflow can handle different supplier size rules, price grids,
              product restrictions, freight, and margin policy. The technical part stays
              deterministic, explainable, and auditable—no LLM decides the price.
            </p>
            <div className="v6-demo-actions">
              <a className="v6-primary" href="#builder">Build your own quote</a>
              <a className="v6-secondary" href="#instant-proof">See the proof below</a>
            </div>
            <div className="v6-outcome-row">
              <span>Fewer manual lookups</span>
              <span>Invalid orders blocked early</span>
              <span>Consistent margin policy</span>
              <span>Every price explainable</span>
            </div>
          </div>

          <InstantPricingProof />
        </header>

        <section className="v6-business-bridge">
          <div>
            <span className="v6-kicker">WHY THIS MATTERS TO A BUSINESS</span>
            <h2>Replace fragile quote-by-spreadsheet work with a repeatable operating process.</h2>
          </div>
          <div className="v6-business-grid">
            <BusinessOutcome title="Quote faster" text="Sales works from one guided flow instead of switching between supplier price books, spreadsheets, and tribal knowledge." />
            <BusinessOutcome title="Prevent bad orders" text="Compatibility and dimension rules stop invalid configurations before they reach purchasing or fulfillment." />
            <BusinessOutcome title="Protect margin" text="Discounts recalculate realized margin and can trigger an approval workflow before a quote is finalized." />
            <BusinessOutcome title="Make changes safer" text="Rule and price-book versions are stored with the quote so future supplier updates do not erase pricing history." />
          </div>
          <p className="v6-evidence-note">
            This is a reference implementation, so I am not claiming fabricated client savings. The demo shows the mechanics I would use to reduce manual quoting work and pricing errors in a production CPQ system.
          </p>
        </section>

        <section className="v6-code-translation">
          <div>
            <strong>Rule snapshot</strong>
            <code>alpha-rules-v1</code>
            <span>Stored with the quote so the exact business rules can be reproduced later.</span>
          </div>
          <div>
            <strong>Price-book snapshot</strong>
            <code>alpha-2026-q3</code>
            <span>Locks the supplier pricing context used for this quote even after future price updates.</span>
          </div>
        </section>
      </main>

      <QuoteStudio />

      <section className="v6-final-cta">
        <span className="v6-kicker">FOR WINDOW TREATMENT + MADE-TO-ORDER TEAMS</span>
        <h2>Quoting across supplier catalogs should not depend on spreadsheets and tribal knowledge.</h2>
        <p>
          If you sell window treatments, custom products, or distributor catalogs with supplier-specific pricing,
          I can help design the rule model, supplier onboarding path, quote workflow, approvals, integrations, and production architecture.
        </p>
        <div>
          <a className="v6-primary" href="https://kohronburton.com" target="_blank" rel="noreferrer">Discuss your quoting workflow →</a>
          <a className="v6-secondary" href={site}>Read the case study</a>
        </div>
      </section>
    </>
  );
}

function InstantPricingProof() {
  if (!initialQuote.valid) {
    return null;
  }

  const rows = [
    ["Price-grid base", initialQuote.pricing.gridBaseCost],
    ["Premium fabric", initialQuote.pricing.fabricSurcharge],
    ["Motorized control", initialQuote.pricing.controlSurcharge],
    ["Freight", initialQuote.pricing.freight],
  ] as const;

  return (
    <aside className="v6-instant-proof" id="instant-proof">
      <div className="v6-proof-head">
        <div>
          <small>PRE-PRICED ALPHA EXAMPLE</small>
          <strong>73.25&quot; × 80.10&quot; motorized shade</strong>
        </div>
        <span>✓ Ready instantly</span>
      </div>

      <div className="v6-proof-price">
        <div>
          <span>Customer price</span>
          <strong>{money.format(initialQuote.pricing.sellPrice)}</strong>
          <small>{(initialQuote.pricing.targetMargin * 100).toFixed(0)}% target margin</small>
        </div>
        <div>
          <span>Supplier prices</span>
          <strong>{initialQuote.normalizedDimensions.width}&quot; × {initialQuote.normalizedDimensions.height}&quot;</strong>
          <small>after whole-inch rounding</small>
        </div>
      </div>

      <div className="v6-proof-breakdown">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value > 0 && label !== "Price-grid base" ? "+" : ""}{money.format(value)}</strong>
          </div>
        ))}
        <div className="v6-proof-total">
          <span>True landed cost</span>
          <strong>{money.format(initialQuote.pricing.trueCost)}</strong>
        </div>
      </div>

      <div className="v6-proof-trace">
        <div className="v6-trace-title">
          <strong>Actual calculation trail</strong>
          <span>{initialQuote.trace.length} deterministic steps</span>
        </div>
        {initialQuote.trace.slice(0, 4).map((step, index) => (
          <div key={`${step.stage}-${index}`}>
            <span>{index + 1}</span>
            <p>{step.message}</p>
          </div>
        ))}
        <a href="#audit">See all calculation steps ↓</a>
      </div>
    </aside>
  );
}

function BusinessOutcome({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}
