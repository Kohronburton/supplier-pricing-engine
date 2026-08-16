const github = "https://github.com/Kohronburton/supplier-pricing-engine";

export default function Home() {
  return (
    <main className="cs-shell">
      <nav className="cs-nav">
        <a className="cs-brand" href="#top" aria-label="Supplier Pricing Engine home">
          <span>SP</span>
          <div>
            <strong>Supplier Pricing Engine</strong>
            <small>CPQ architecture case study</small>
          </div>
        </a>
        <div className="cs-nav-links">
          <a href="#case-study">Case study</a>
          <a href="#proof">Proof</a>
          <a href={`${github}/tree/main/tests`} target="_blank" rel="noreferrer">Tests ↗</a>
          <a className="cs-nav-cta" href="/demo">Launch demo</a>
        </div>
      </nav>

      <header className="cs-hero" id="top">
        <div className="cs-hero-copy">
          <span className="cs-kicker">CPQ ARCHITECTURE CASE STUDY</span>
          <h1>Pricing gets messy when every supplier has a different rulebook.</h1>
          <p>
            This reference implementation shows how I would turn supplier price books,
            size rules, compatibility restrictions, freight, and margin policy into one
            predictable quoting workflow—without hiding pricing logic inside the UI.
          </p>
          <div className="cs-actions">
            <a className="cs-primary" href="/demo">Open the live quote studio</a>
            <a className="cs-secondary" href={github} target="_blank" rel="noreferrer">View the source ↗</a>
          </div>
          <div className="cs-trust-row">
            <span>Deterministic price path</span>
            <span>Versioned supplier rules</span>
            <span>Automated regression tests</span>
            <span>Explainable quotes</span>
          </div>
        </div>

        <aside className="cs-problem-visual" aria-label="Why supplier pricing is difficult">
          <div className="cs-visual-head">
            <div>
              <small>SAME CUSTOMER REQUEST</small>
              <strong>73.25&quot; × 80.10&quot; motorized shade</strong>
            </div>
            <span>3 suppliers</span>
          </div>
          <SupplierExample name="Alpha" rule="Round to 1\"" normalized="74 × 81" detail="Premium +12% · Motor +$185" />
          <SupplierExample name="Beta" rule="Round to 0.5\"" normalized="73.5 × 80.5" detail="Different grid · Different freight" />
          <SupplierExample name="Gamma" rule="Round to 2\"" normalized="74 × 82" detail="Product program changes base price" />
          <div className="cs-visual-result">
            <span>The goal</span>
            <strong>One sales workflow. Different rule sets underneath.</strong>
          </div>
        </aside>
      </header>

      <section className="cs-story" id="case-study">
        <div className="cs-section-intro">
          <span className="cs-kicker">THE CASE STUDY</span>
          <h2>The hard part is not the quote screen. It is owning the rules behind it.</h2>
          <p>
            A CPQ system becomes expensive to maintain when supplier behavior leaks into
            forms, components, and one-off conditionals. The architecture has to make
            change safe before it makes quoting fast.
          </p>
        </div>

        <div className="cs-story-grid">
          <StoryCard
            number="01"
            title="Problem"
            text="Suppliers price the same type of product differently. Width and height rounding, product eligibility, fabrics, motors, options, grids, surcharges, and freight all vary."
          />
          <StoryCard
            number="02"
            title="Constraint"
            text="A salesperson needs one simple workflow, but the result still has to be deterministic, testable, explainable, and reproducible months after supplier prices change."
          />
          <StoryCard
            number="03"
            title="Tradeoff"
            text="I kept supplier behavior in versioned rule data and kept the core engine supplier-agnostic. The demo uses a modular monolith instead of premature microservices."
          />
          <StoryCard
            number="04"
            title="Result"
            text="The same quote flow can price multiple suppliers and products, block invalid combinations, preserve provenance, protect margin, and produce a customer-ready quote."
          />
        </div>
      </section>

      <section className="cs-decisions">
        <div className="cs-section-intro compact">
          <span className="cs-kicker">ENGINEERING JUDGMENT</span>
          <h2>Three decisions matter more than the framework.</h2>
        </div>

        <div className="cs-decision-grid">
          <DecisionCard
            label="PRICE AUTHORITY"
            title="No LLM in the pricing path"
            text="AI can help ingest catalogs or assist admin work. It should not decide the authoritative price. Pricing stays deterministic and regression-testable."
          />
          <DecisionCard
            label="CHANGE MANAGEMENT"
            title="Version the rules, not just the code"
            text="Every successful quote carries the supplier rule version and price-table version so old quotes can be reproduced after future price changes."
          />
          <DecisionCard
            label="SYSTEM SHAPE"
            title="Modular first, distributed later"
            text="A clean modular monolith keeps the first production release easier to ship and debug. Split services only when scale or ownership boundaries justify it."
          />
        </div>

        <div className="cs-not-doing">
          <span>WHAT I DELIBERATELY AVOIDED</span>
          <div>
            <strong>Giant supplier if/else chains</strong>
            <strong>Pricing logic in React components</strong>
            <strong>Opaque AI-generated prices</strong>
            <strong>Microservices for a problem that does not need them yet</strong>
          </div>
        </div>
      </section>

      <section className="cs-proof" id="proof">
        <div className="cs-section-intro">
          <span className="cs-kicker">PROOF, NOT PROMISES</span>
          <h2>The architecture is backed by executable evidence.</h2>
          <p>
            The repository is public, the pricing engine is covered by regression tests,
            and GitHub Actions runs the test suite and production build before changes are merged.
          </p>
        </div>

        <div className="cs-proof-grid">
          <ProofCard value="9" label="Automated test cases" detail="Supplier pricing + quote commercial math" href={`${github}/tree/main/tests`} />
          <ProofCard value="3" label="Supplier rule sets" detail="Different rounding, grids, restrictions, freight" href={`${github}/blob/main/src/suppliers/rules.ts`} />
          <ProofCard value="9" label="Product programs" detail="Supplier-specific catalog behavior" href={`${github}/blob/main/src/suppliers/rules.ts`} />
          <ProofCard value="CI" label="Tests + production build" detail="GitHub Actions validates every PR" href={`${github}/actions`} />
        </div>

        <div className="cs-pipeline">
          <span>Configuration</span>
          <b>→</b>
          <span>Validation</span>
          <b>→</b>
          <span>Compatibility</span>
          <b>→</b>
          <span>Rounding</span>
          <b>→</b>
          <span>Price grid</span>
          <b>→</b>
          <span>Surcharges</span>
          <b>→</b>
          <span>Freight</span>
          <b>→</b>
          <span>Margin</span>
          <b>→</b>
          <span>Quote</span>
        </div>
      </section>

      <section className="cs-demo-cta">
        <div>
          <span className="cs-kicker">NOW TRY IT</span>
          <h2>The case study explains the judgment. The demo proves the behavior.</h2>
          <p>
            Build a multi-room quote, switch suppliers, trigger an invalid combination,
            apply a discount, hit the margin guard, and generate the customer-facing output.
          </p>
        </div>
        <div className="cs-actions">
          <a className="cs-primary" href="/demo">Launch interactive demo</a>
          <a className="cs-secondary" href={`${github}/blob/main/docs/architecture-decisions.md`} target="_blank" rel="noreferrer">Read architecture decisions ↗</a>
        </div>
      </section>

      <footer className="cs-footer">
        <span>Supplier Pricing Engine · CPQ architecture case study</span>
        <span>Built by <a href="https://kohronburton.com" target="_blank" rel="noreferrer">Kohron Burton ↗</a></span>
      </footer>
    </main>
  );
}

function SupplierExample({ name, rule, normalized, detail }: { name: string; rule: string; normalized: string; detail: string }) {
  return (
    <div className="cs-supplier-example">
      <div><strong>Supplier {name}</strong><span>{rule}</span></div>
      <div><small>PRICE SIZE</small><strong>{normalized}</strong></div>
      <span>{detail}</span>
    </div>
  );
}

function StoryCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="cs-story-card">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function DecisionCard({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <article className="cs-decision-card">
      <span>{label}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ProofCard({ value, label, detail, href }: { value: string; label: string; detail: string; href: string }) {
  return (
    <a className="cs-proof-card" href={href} target="_blank" rel="noreferrer">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
      <b>Inspect ↗</b>
    </a>
  );
}
