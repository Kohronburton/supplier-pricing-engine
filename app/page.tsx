"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CalculationTraceStep,
  OptionId,
  ProductId,
  QuoteResult,
  SupplierId,
} from "@/src/domain/models";
import { supplierRuleSets } from "@/src/suppliers/rules";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const stageNames: Record<CalculationTraceStep["stage"], string> = {
  validation: "Size check",
  compatibility: "Compatibility",
  rounding: "Supplier rounding",
  grid: "Price table",
  surcharge: "Options & upgrades",
  freight: "Shipping",
  margin: "Selling price",
};

const initialForm = {
  supplier: "alpha" as SupplierId,
  product: "roller-shade" as ProductId,
  width: "73.25",
  height: "80.10",
  fabric: "premium",
  controlType: "motorized",
  targetMargin: "38",
};

const initialCustomer = {
  customerName: "Sample Customer",
  projectName: "Brickell Residence",
  email: "customer@example.com",
  phone: "(305) 555-0148",
  salesperson: "Kohron Burton",
};

const scenarios = [
  {
    id: "premium",
    label: "Premium motorized",
    note: "Valid Alpha quote",
    supplier: "alpha" as SupplierId,
    product: "roller-shade" as ProductId,
    width: "73.25",
    height: "80.10",
    fabric: "premium",
    controlType: "motorized",
    targetMargin: "38",
    options: ["cassette"] as OptionId[],
  },
  {
    id: "blocked",
    label: "Catch a bad combo",
    note: "Beta blocks it",
    supplier: "beta" as SupplierId,
    product: "roller-shade" as ProductId,
    width: "48",
    height: "70",
    fabric: "blackout",
    controlType: "motorized",
    targetMargin: "40",
    options: [] as OptionId[],
  },
  {
    id: "oversize",
    label: "Oversize designer",
    note: "Gamma freight rules",
    supplier: "gamma" as SupplierId,
    product: "zebra-shade" as ProductId,
    width: "90.25",
    height: "134.10",
    fabric: "premium",
    controlType: "smart",
    targetMargin: "36",
    options: ["valance"] as OptionId[],
  },
];

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [customer, setCustomer] = useState(initialCustomer);
  const [options, setOptions] = useState<OptionId[]>(["cassette"]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [quoteNumber] = useState(() => makeQuoteNumber());
  const [expiresOn] = useState(() => addDays(new Date(), 30));

  const supplier = supplierRuleSets[form.supplier];
  const activeProduct = supplier.products.find((item) => item.id === form.product);
  const activeControl = supplier.controls.find((item) => item.id === form.controlType);
  const activeFabric = supplier.fabrics.find((item) => item.id === form.fabric);

  const payload = useMemo(
    () => ({
      supplier: form.supplier,
      product: form.product,
      width: Number(form.width),
      height: Number(form.height),
      fabric: form.fabric,
      controlType: form.controlType,
      options,
      targetMargin: Number(form.targetMargin) / 100,
    }),
    [form, options],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setGenerated(false);
      try {
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = (await response.json()) as QuoteResult;
        setResult(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResult({
            valid: false,
            errors: ["The quote service could not be reached."],
            trace: [],
          });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [payload]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateField(field: keyof typeof form, value: string) {
    if (field === "supplier") {
      const nextSupplier = value as SupplierId;
      const nextRules = supplierRuleSets[nextSupplier];
      setForm((current) => ({
        ...current,
        supplier: nextSupplier,
        product: nextRules.products[0].id,
        targetMargin: String(Math.round(nextRules.defaultTargetMargin * 100)),
      }));
      setOptions([]);
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCustomer(field: keyof typeof customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function toggleOption(option: OptionId) {
    setOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  function loadScenario(scenario: (typeof scenarios)[number]) {
    setForm({
      supplier: scenario.supplier,
      product: scenario.product,
      width: scenario.width,
      height: scenario.height,
      fabric: scenario.fabric,
      controlType: scenario.controlType,
      targetMargin: scenario.targetMargin,
    });
    setOptions(scenario.options);
    setToast(`Loaded: ${scenario.label}`);
  }

  function generateQuote() {
    if (!result?.valid) {
      setToast("Fix the blocked configuration before generating a quote.");
      return;
    }
    setGenerated(true);
    setToast("Professional quote generated.");
    window.setTimeout(() => {
      document.getElementById("quote-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function saveQuote() {
    if (!result?.valid) {
      setToast("Only valid quotes can be saved.");
      return;
    }

    const key = "supplier-pricing-engine:saved-quotes";
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    const snapshot = {
      quoteNumber,
      createdAt: new Date().toISOString(),
      customer,
      configuration: payload,
      result,
    };
    window.localStorage.setItem(key, JSON.stringify([snapshot, ...existing].slice(0, 25)));
    setToast(`Saved ${quoteNumber} to this browser.`);
  }

  function downloadPdf() {
    if (!result?.valid) {
      setToast("Generate a valid quote before downloading a PDF.");
      return;
    }

    const lines = [
      "SUPPLIER PRICING ENGINE - PROFESSIONAL QUOTE",
      "",
      `Quote: ${quoteNumber}`,
      `Customer: ${customer.customerName || "Not provided"}`,
      `Project: ${customer.projectName || "Not provided"}`,
      `Email: ${customer.email || "Not provided"}`,
      `Phone: ${customer.phone || "Not provided"}`,
      `Salesperson: ${customer.salesperson || "Not provided"}`,
      `Valid through: ${formatDate(expiresOn)}`,
      "",
      `Supplier: ${supplier.name}`,
      `Product: ${activeProduct?.label ?? form.product}`,
      `Size entered: ${form.width} x ${form.height} in`,
      `Supplier size: ${result.normalizedDimensions.width} x ${result.normalizedDimensions.height} in`,
      `Fabric: ${activeFabric?.label ?? form.fabric}`,
      `Control: ${activeControl?.label ?? form.controlType}`,
      `Options: ${options.length ? options.map(optionLabel).join(", ") : "None"}`,
      "",
      `Base product: ${money.format(result.pricing.baseCost)}`,
      `Fabric: ${money.format(result.pricing.fabricSurcharge)}`,
      `Control / motor: ${money.format(result.pricing.controlSurcharge)}`,
      `Options: ${money.format(result.pricing.optionSurcharge)}`,
      `Shipping: ${money.format(result.pricing.freight)}`,
      `True landed cost: ${money.format(result.pricing.trueCost)}`,
      `Target margin: ${(result.pricing.targetMargin * 100).toFixed(1)}%`,
      `CUSTOMER PRICE: ${money.format(result.pricing.sellPrice)}`,
      "",
      `Rule version: ${result.ruleVersion}`,
      `Price table: ${result.gridVersion}`,
      "",
      "Calculation trace:",
      ...result.trace.map((step, index) => `${index + 1}. ${stageNames[step.stage]} - ${step.message}`),
    ];

    const pdf = createTextPdf(lines);
    const url = URL.createObjectURL(pdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quoteNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast("PDF downloaded.");
  }

  const roundedWidth = roundUp(Number(form.width), supplier.dimensions.roundingIncrement);
  const roundedHeight = roundUp(Number(form.height), supplier.dimensions.roundingIncrement);
  const profitDollars = result?.valid
    ? result.pricing.sellPrice - result.pricing.trueCost
    : 0;

  const fixIdeas = getFixIdeas({
    width: Number(form.width),
    height: Number(form.height),
    minWidth: supplier.dimensions.minWidth,
    maxWidth: supplier.dimensions.maxWidth,
    minHeight: supplier.dimensions.minHeight,
    maxHeight: supplier.dimensions.maxHeight,
    controlLabel: activeControl?.label,
    controlMinWidth: activeControl?.minWidth,
  });

  return (
    <main className="shell v4-shell">
      {toast ? <div className="toast">{toast}</div> : null}

      <nav className="v4-nav">
        <a className="brand-lockup" href="#top" aria-label="Supplier Pricing Engine home">
          <span className="brand-mark">SP</span>
          <span>
            <strong>Supplier Pricing Engine</strong>
            <small>CPQ reference implementation</small>
          </span>
        </a>
        <div className="nav-actions">
          <a href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a className="nav-cta" href="https://kohronburton.com" target="_blank" rel="noreferrer">Built by Kohron Burton ↗</a>
        </div>
      </nav>

      <header className="v4-hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">LIVE CPQ PROOF-OF-CONCEPT · V4</div>
          <h1>Turn messy supplier rules into <span>one clean quote.</span></h1>
          <p>
            Different price tables. Different size rules. Different motors, fabrics,
            freight and margins. One deterministic engine handles all of it—and shows
            exactly how every dollar was calculated.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>
              Build a quote
            </button>
            <button className="ghost-action" type="button" onClick={() => loadScenario(scenarios[1])}>
              Watch it catch a bad combo
            </button>
          </div>
        </div>

        <div className="hero-proof">
          <div className="live-pill"><span className="pulse" /> Pricing engine live</div>
          <div className="proof-grid">
            <ProofStat value="3" label="supplier rule sets" />
            <ProofStat value="9" label="product programs" />
            <ProofStat value="7" label="pricing stages" />
            <ProofStat value="100%" label="explainable" />
          </div>
          <div className="proof-note">
            <strong>No LLM in the price path.</strong>
            <span>Authoritative pricing stays deterministic, testable and auditable.</span>
          </div>
        </div>
      </header>

      <section className="workflow-strip" aria-label="Quote workflow">
        <WorkflowStep number="01" title="Configure" text="Customer + product" active />
        <WorkflowStep number="02" title="Validate" text="Rules + compatibility" />
        <WorkflowStep number="03" title="Price" text="Cost + freight + margin" />
        <WorkflowStep number="04" title="Quote" text="Save + PDF + audit" />
      </section>

      <section className="scenario-section">
        <div>
          <span className="step">TRY THE ENGINE</span>
          <h2>Three clicks that prove the architecture.</h2>
        </div>
        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <button key={scenario.id} type="button" className="scenario-card" onClick={() => loadScenario(scenario)}>
              <span>{scenario.note}</span>
              <strong>{scenario.label}</strong>
              <small>Load scenario →</small>
            </button>
          ))}
        </div>
      </section>

      <section className="customer-panel" id="workspace">
        <div className="section-heading-row">
          <div>
            <span className="step">QUOTE DETAILS</span>
            <h2>Customer & project</h2>
            <p>These details carry through to the professional quote and PDF.</p>
          </div>
          <div className="quote-id-card">
            <span>Quote</span>
            <strong>{quoteNumber}</strong>
            <small>Valid through {formatDate(expiresOn)}</small>
          </div>
        </div>
        <div className="customer-grid">
          <Field label="Customer" help="Who is this quote for?">
            <input value={customer.customerName} onChange={(event) => updateCustomer("customerName", event.target.value)} />
          </Field>
          <Field label="Project" help="Job, room or project name">
            <input value={customer.projectName} onChange={(event) => updateCustomer("projectName", event.target.value)} />
          </Field>
          <Field label="Email" help="Customer contact">
            <input type="email" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} />
          </Field>
          <Field label="Phone" help="Customer phone">
            <input value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} />
          </Field>
          <Field label="Salesperson" help="Owner of this quote" className="customer-wide">
            <input value={customer.salesperson} onChange={(event) => updateCustomer("salesperson", event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="workspace v4-workspace">
        <div className="panel configurator v4-panel">
          <div className="panel-heading">
            <div>
              <span className="step">CONFIGURE</span>
              <h2>Build the product</h2>
              <p className="section-help">Choose what the customer wants. Rules update with the supplier.</p>
            </div>
            <span className="supplier-chip">{supplier.name}</span>
          </div>

          <div className="form-grid">
            <Field label="Supplier" help="Whose rules should we use?">
              <select value={form.supplier} onChange={(event) => updateField("supplier", event.target.value)}>
                <option value="alpha">Supplier Alpha</option>
                <option value="beta">Supplier Beta</option>
                <option value="gamma">Supplier Gamma</option>
              </select>
            </Field>

            <Field label="Product" help={activeProduct?.description ?? "Supplier product program"}>
              <select value={form.product} onChange={(event) => updateField("product", event.target.value)}>
                {supplier.products.map((product) => (
                  <option key={product.id} value={product.id}>{product.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Width (in)" help={`${supplier.dimensions.minWidth}–${supplier.dimensions.maxWidth}\" allowed`}>
              <input type="number" step="0.01" value={form.width} onChange={(event) => updateField("width", event.target.value)} />
            </Field>

            <Field label="Height (in)" help={`${supplier.dimensions.minHeight}–${supplier.dimensions.maxHeight}\" allowed`}>
              <input type="number" step="0.01" value={form.height} onChange={(event) => updateField("height", event.target.value)} />
            </Field>

            <Field label="Fabric" help="Supplier fabric program">
              <select value={form.fabric} onChange={(event) => updateField("fabric", event.target.value)}>
                {supplier.fabrics.map((fabric) => (
                  <option key={fabric.id} value={fabric.id}>{fabric.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Control" help="Manual, motorized or smart">
              <select value={form.controlType} onChange={(event) => updateField("controlType", event.target.value)}>
                {supplier.controls.map((control) => (
                  <option key={control.id} value={control.id}>{control.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Target margin (%)" help="Commercial pricing policy" className="margin-field">
              <input type="number" min="1" max="99" step="0.5" value={form.targetMargin} onChange={(event) => updateField("targetMargin", event.target.value)} />
            </Field>
          </div>

          <div className="options-block">
            <span className="field-label">Options</span>
            <span className="field-help standalone">Click to add or remove extras.</span>
            <div className="option-grid">
              {supplier.options.map((option) => (
                <button key={option.id} type="button" className={options.includes(option.id) ? "option selected" : "option"} onClick={() => toggleOption(option.id)}>
                  <span className="option-check">{options.includes(option.id) ? "✓" : "+"}</span>
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.fixedSurcharge === 0 ? "Included" : `+${money.format(option.fixedSurcharge)}`}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="active-rule-bar">
            <span>Active rules</span>
            <code>{supplier.dimensions.roundingIncrement}&quot; rounding</code>
            <code>{supplier.ruleVersion}</code>
            <code>{supplier.gridVersion}</code>
          </div>
        </div>

        <div className="panel analysis-panel v4-panel price-console">
          <div className="panel-heading">
            <div>
              <span className="step">LIVE PRICE</span>
              <h2>Deal desk</h2>
              <p className="section-help">The engine validates first. It only prices combinations that work.</p>
            </div>
            {loading ? (
              <span className="status neutral">Checking…</span>
            ) : result?.valid ? (
              <span className="status valid">✓ Ready to quote</span>
            ) : (
              <span className="status invalid">× Blocked</span>
            )}
          </div>

          {result?.valid ? (
            <>
              <div className="price-hero-card">
                <div>
                  <span>Customer price</span>
                  <strong>{money.format(result.pricing.sellPrice)}</strong>
                  <small>{(result.pricing.targetMargin * 100).toFixed(1)}% target margin</small>
                </div>
                <div className="profit-chip">
                  <span>Gross profit</span>
                  <strong>{money.format(profitDollars)}</strong>
                </div>
              </div>

              <div className="normalized-card simple-normalized">
                <div>
                  <span>Supplier size used</span>
                  <small>You entered {form.width}&quot; × {form.height}&quot;</small>
                </div>
                <strong>{result.normalizedDimensions.width}&quot; × {result.normalizedDimensions.height}&quot;</strong>
                <p>{supplier.name} rounds up in {supplier.dimensions.roundingIncrement}&quot; increments before price-table lookup.</p>
              </div>

              <div className="breakdown compact-breakdown">
                <PriceRow label="Price-grid base" value={result.pricing.gridBaseCost} />
                {result.pricing.productAdjustment > 0 ? <PriceRow label={`${activeProduct?.label ?? "Product"} adjustment`} value={result.pricing.productAdjustment} prefix /> : null}
                <PriceRow label="Fabric" value={result.pricing.fabricSurcharge} prefix />
                <PriceRow label="Control / motor" value={result.pricing.controlSurcharge} prefix />
                <PriceRow label="Options" value={result.pricing.optionSurcharge} prefix />
                <PriceRow label="Shipping" value={result.pricing.freight} prefix />
                <div className="rule" />
                <PriceRow label="True landed cost" value={result.pricing.trueCost} emphasis />
              </div>
            </>
          ) : result ? (
            <div className="error-card v4-error-card">
              <span className="error-kicker">QUOTE BLOCKED BEFORE PRICING</span>
              <h3>The engine caught a supplier-rule conflict.</h3>
              <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>
              <div className="fix-box">
                <strong>Suggested fix</strong>
                {fixIdeas.length ? <ul>{fixIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul> : <p>Change the product, size, fabric, control or options. The engine will re-check automatically.</p>}
              </div>
            </div>
          ) : <div className="empty-card">Preparing the pricing engine…</div>}
        </div>
      </section>

      <section className="business-proof">
        <div className="section-heading-row">
          <div>
            <span className="step">WHY THIS ARCHITECTURE SCALES</span>
            <h2>Change the supplier. Keep the engine.</h2>
          </div>
          <span className="supplier-chip">{supplier.name} active</span>
        </div>
        <div className="proof-cards">
          <MiniProof title="Product catalog" value={`${supplier.products.length} programs`} text="Supplier-specific products without a new UI flow." />
          <MiniProof title="Rounding" value={`${supplier.dimensions.roundingIncrement}\" increments`} text={`${form.width}\" × ${form.height}\" becomes ${roundedWidth}\" × ${roundedHeight}\".`} />
          <MiniProof title="Rule version" value={supplier.ruleVersion} text="Historical quotes retain the exact rules used." />
          <MiniProof title="Price table" value={supplier.gridVersion} text={`Effective ${formatIsoDate(supplier.effectiveFrom)}.`} />
        </div>
      </section>

      <section className="trace-panel v4-trace-panel">
        <div className="trace-heading">
          <div>
            <span className="step">EXPLAINABLE PRICING</span>
            <h2>How we got this price</h2>
          </div>
          <span>Deterministic · auditable · testable</span>
        </div>
        <div className="trace-list">
          {result?.trace.length ? result.trace.map((item, index) => (
            <div className="trace-item" key={`${item.stage}-${index}`}>
              <span className={result.valid ? "trace-dot" : "trace-dot warn"}>{index + 1}</span>
              <div>
                <strong>{stageNames[item.stage]}</strong>
                <p>{item.message}</p>
              </div>
            </div>
          )) : <p className="trace-empty">No calculation steps yet.</p>}
        </div>
      </section>

      {generated && result?.valid ? (
        <section className="quote-preview" id="quote-preview">
          <div className="quote-preview-toolbar">
            <div>
              <span className="step">PROFESSIONAL QUOTE</span>
              <h2>Ready to send</h2>
            </div>
            <span className="status valid">✓ Generated</span>
          </div>
          <div className="quote-paper">
            <div className="quote-paper-head">
              <div>
                <span className="quote-logo">SP</span>
                <strong>Supplier Pricing Engine</strong>
                <small>Professional Quote</small>
              </div>
              <div className="quote-meta">
                <strong>{quoteNumber}</strong>
                <span>Valid through {formatDate(expiresOn)}</span>
              </div>
            </div>
            <div className="quote-party-grid">
              <div>
                <small>PREPARED FOR</small>
                <strong>{customer.customerName || "Customer"}</strong>
                <span>{customer.projectName}</span>
                <span>{customer.email}</span>
                <span>{customer.phone}</span>
              </div>
              <div>
                <small>PREPARED BY</small>
                <strong>{customer.salesperson || "Salesperson"}</strong>
                <span>{supplier.name}</span>
                <span>Rule set {result.ruleVersion}</span>
              </div>
            </div>
            <div className="quote-line-item">
              <div>
                <strong>{activeProduct?.label ?? form.product}</strong>
                <span>{result.normalizedDimensions.width}&quot; × {result.normalizedDimensions.height}&quot; · {activeFabric?.label} · {activeControl?.label}</span>
                <small>{options.length ? options.map(optionLabel).join(" · ") : "No additional options"}</small>
              </div>
              <strong>{money.format(result.pricing.sellPrice)}</strong>
            </div>
            <div className="quote-totals">
              <span>Quote total</span>
              <strong>{money.format(result.pricing.sellPrice)}</strong>
            </div>
            <div className="quote-fineprint">
              Pricing is based on supplier rule set <strong>{result.ruleVersion}</strong> and price table <strong>{result.gridVersion}</strong>. This reference implementation preserves calculation provenance so the quote can be reproduced later.
            </div>
          </div>
        </section>
      ) : null}

      <section className="action-dock" aria-label="Quote actions">
        <div>
          <span>{result?.valid ? "Quote is valid" : "Quote needs attention"}</span>
          <strong>{result?.valid ? money.format(result.pricing.sellPrice) : "Fix configuration"}</strong>
        </div>
        <div className="dock-actions">
          <button type="button" className="primary-action" onClick={generateQuote}>Generate Professional Quote</button>
          <button type="button" className="secondary-action" onClick={saveQuote}>Save Quote</button>
          <button type="button" className="secondary-action" onClick={downloadPdf}>Download PDF</button>
          <a className="secondary-action link-button" href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">View Source</a>
        </div>
      </section>

      <section className="builder-cta">
        <div>
          <span className="step">ARCHITECTURE + PRODUCT THINKING</span>
          <h2>Built by Kohron Burton.</h2>
          <p>A focused CPQ reference implementation showing how complex supplier rules can become a clean, maintainable quoting workflow.</p>
        </div>
        <div className="builder-links">
          <a href="https://kohronburton.com" target="_blank" rel="noreferrer">Portfolio ↗</a>
          <a href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </section>

      <footer className="v4-footer">
        <span>Supplier Pricing Engine · CPQ Reference Implementation</span>
        <span>Next.js · TypeScript · deterministic pricing rules · automated tests</span>
      </footer>
    </main>
  );
}

function Field({ label, help, className, children }: { label: string; help: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span>{label}</span>
      <small className="field-help">{help}</small>
      {children}
    </label>
  );
}

function PriceRow({ label, value, emphasis = false, prefix = false }: { label: string; value: number; emphasis?: boolean; prefix?: boolean }) {
  const formatted = money.format(value);
  return (
    <div className={emphasis ? "price-row emphasis" : "price-row"}>
      <span>{label}</span>
      <strong>{prefix && value > 0 ? `+${formatted}` : formatted}</strong>
    </div>
  );
}

function ProofStat({ value, label }: { value: string; label: string }) {
  return <div className="proof-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function WorkflowStep({ number, title, text, active = false }: { number: string; title: string; text: string; active?: boolean }) {
  return <div className={active ? "workflow-step active" : "workflow-step"}><span>{number}</span><div><strong>{title}</strong><small>{text}</small></div></div>;
}

function MiniProof({ title, value, text }: { title: string; value: string; text: string }) {
  return <div className="mini-proof"><span>{title}</span><strong>{value}</strong><p>{text}</p></div>;
}

function optionLabel(id: OptionId): string {
  return id === "side-channel" ? "Side Channel" : id.charAt(0).toUpperCase() + id.slice(1);
}

function roundUp(value: number, increment: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(value / increment) * increment;
}

function getFixIdeas(input: {
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  controlLabel?: string;
  controlMinWidth?: number;
}): string[] {
  const ideas: string[] = [];
  if (input.width < input.minWidth) ideas.push(`Increase width to at least ${input.minWidth}\".`);
  if (input.width > input.maxWidth) ideas.push(`Reduce width to ${input.maxWidth}\" or less.`);
  if (input.height < input.minHeight) ideas.push(`Increase height to at least ${input.minHeight}\".`);
  if (input.height > input.maxHeight) ideas.push(`Reduce height to ${input.maxHeight}\" or less.`);
  if (input.controlMinWidth && input.width < input.controlMinWidth) ideas.push(`Increase width to ${input.controlMinWidth}\" for ${input.controlLabel ?? "this control"}, or choose a different control.`);
  return ideas;
}

function makeQuoteNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = String(Date.now()).slice(-4);
  return `Q-${y}${m}${d}-${suffix}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatIsoDate(value: string): string {
  return formatDate(new Date(`${value}T00:00:00`));
}

function createTextPdf(lines: string[]): Blob {
  const safeLines = lines.flatMap((line) => wrapPdfLine(line, 92)).slice(0, 48);
  const textCommands = safeLines
    .map((line, index) => `${index === 0 ? "" : "T* "}(${escapePdfText(toAscii(line))}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 10 Tf\n50 760 Td\n14 TL\n${textCommands}\nET`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function wrapPdfLine(value: string, max: number): string[] {
  if (value.length <= max) return [value];
  const words = value.split(" ");
  const rows: string[] = [];
  let row = "";
  for (const word of words) {
    if (`${row} ${word}`.trim().length > max) {
      rows.push(row);
      row = word;
    } else {
      row = `${row} ${word}`.trim();
    }
  }
  if (row) rows.push(row);
  return rows;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toAscii(value: string): string {
  return value.replace(/[–—]/g, "-").replace(/[→]/g, "->").replace(/[^\x20-\x7E]/g, "");
}
