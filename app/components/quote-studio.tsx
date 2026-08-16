"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CalculationTraceStep,
  OptionId,
  ProductId,
  QuoteResult,
  SupplierId,
} from "@/src/domain/models";
import { calculateQuoteCommercials } from "@/src/quote/quote-math";
import { supplierRuleSets } from "@/src/suppliers/rules";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const minimumMargin = 0.3;

const stageNames: Record<CalculationTraceStep["stage"], string> = {
  validation: "Size check",
  compatibility: "Compatibility",
  rounding: "Supplier rounding",
  grid: "Price table",
  surcharge: "Options & upgrades",
  freight: "Shipping",
  margin: "Selling price",
};

interface ConfigForm {
  supplier: SupplierId;
  product: ProductId;
  width: string;
  height: string;
  fabric: string;
  controlType: string;
  targetMargin: string;
}

interface CustomerForm {
  customerName: string;
  projectName: string;
  email: string;
  phone: string;
  salesperson: string;
}

interface QuoteLineItem {
  id: string;
  room: string;
  quantity: number;
  supplier: SupplierId;
  supplierName: string;
  product: ProductId;
  productLabel: string;
  enteredWidth: number;
  enteredHeight: number;
  normalizedWidth: number;
  normalizedHeight: number;
  fabricLabel: string;
  controlLabel: string;
  options: OptionId[];
  unitSellPrice: number;
  unitTrueCost: number;
  ruleVersion: string;
  gridVersion: string;
  trace: CalculationTraceStep[];
}

const initialForm: ConfigForm = {
  supplier: "alpha",
  product: "roller-shade",
  width: "73.25",
  height: "80.10",
  fabric: "premium",
  controlType: "motorized",
  targetMargin: "38",
};

const initialCustomer: CustomerForm = {
  customerName: "Sample Customer",
  projectName: "Brickell Residence",
  email: "customer@example.com",
  phone: "(305) 555-0148",
  salesperson: "Kohron Burton",
};

const currentItemScenarios = [
  {
    id: "premium",
    label: "Premium motorized",
    note: "Alpha · clean valid quote",
    form: {
      supplier: "alpha" as SupplierId,
      product: "roller-shade" as ProductId,
      width: "73.25",
      height: "80.10",
      fabric: "premium",
      controlType: "motorized",
      targetMargin: "38",
    },
    options: ["cassette"] as OptionId[],
    room: "Living Room",
    quantity: 2,
  },
  {
    id: "blocked",
    label: "Catch a bad combo",
    note: "Beta · blackout + motor conflict",
    form: {
      supplier: "beta" as SupplierId,
      product: "roller-shade" as ProductId,
      width: "48",
      height: "70",
      fabric: "blackout",
      controlType: "motorized",
      targetMargin: "40",
    },
    options: [] as OptionId[],
    room: "Guest Room",
    quantity: 1,
  },
  {
    id: "designer",
    label: "Designer oversize",
    note: "Gamma · zebra + freight rules",
    form: {
      supplier: "gamma" as SupplierId,
      product: "zebra-shade" as ProductId,
      width: "90.25",
      height: "134.10",
      fabric: "premium",
      controlType: "smart",
      targetMargin: "36",
    },
    options: ["valance"] as OptionId[],
    room: "Primary Suite",
    quantity: 1,
  },
];

const wholeHomeDemo = [
  {
    room: "Living Room",
    quantity: 2,
    payload: {
      supplier: "alpha" as SupplierId,
      product: "roller-shade" as ProductId,
      width: 73.25,
      height: 80.1,
      fabric: "premium",
      controlType: "motorized",
      options: ["cassette"] as OptionId[],
      targetMargin: 0.38,
    },
  },
  {
    room: "Primary Suite",
    quantity: 3,
    payload: {
      supplier: "beta" as SupplierId,
      product: "cellular-shade" as ProductId,
      width: 55.5,
      height: 72,
      fabric: "standard",
      controlType: "manual",
      options: ["valance"] as OptionId[],
      targetMargin: 0.4,
    },
  },
  {
    room: "Home Office",
    quantity: 1,
    payload: {
      supplier: "gamma" as SupplierId,
      product: "zebra-shade" as ProductId,
      width: 71.1,
      height: 98.1,
      fabric: "premium",
      controlType: "motorized",
      options: [] as OptionId[],
      targetMargin: 0.36,
    },
  },
];

export default function QuoteStudio() {
  const [form, setForm] = useState<ConfigForm>(initialForm);
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [options, setOptions] = useState<OptionId[]>(["cassette"]);
  const [room, setRoom] = useState("Living Room");
  const [quantity, setQuantity] = useState("2");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [depositPercent, setDepositPercent] = useState("50");
  const [approvalState, setApprovalState] = useState<"none" | "pending" | "approved">("none");
  const [generated, setGenerated] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("Q-DEMO");
  const [expiresLabel, setExpiresLabel] = useState("30 days from today");
  const [toast, setToast] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const supplier = supplierRuleSets[form.supplier];
  const activeProduct = supplier.products.find((item) => item.id === form.product);
  const activeFabric = supplier.fabrics.find((item) => item.id === form.fabric);
  const activeControl = supplier.controls.find((item) => item.id === form.controlType);

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

  const commercials = useMemo(
    () =>
      calculateQuoteCommercials(
        quoteItems,
        Number(discountPercent),
        Number(depositPercent),
        minimumMargin,
      ),
    [quoteItems, discountPercent, depositPercent],
  );

  const canFinalize =
    quoteItems.length > 0 &&
    (!commercials.approvalRequired || approvalState === "approved");

  const quoteStatus = generated
    ? "Generated"
    : quoteItems.length === 0
      ? "Draft"
      : commercials.approvalRequired && approvalState !== "approved"
        ? approvalState === "pending"
          ? "Approval pending"
          : "Approval required"
        : "Ready to send";

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
          setResult({ valid: false, errors: ["The quote service could not be reached."], trace: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [payload]);

  useEffect(() => {
    setQuoteNumber(makeQuoteNumber());
    setExpiresLabel(formatDate(addDays(new Date(), 30)));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function changeSupplier(value: SupplierId) {
    const next = supplierRuleSets[value];
    setForm((current) => ({
      ...current,
      supplier: value,
      product: next.products[0].id,
      fabric: next.fabrics[0].id,
      controlType: next.controls[0].id,
      targetMargin: String(Math.round(next.defaultTargetMargin * 100)),
    }));
    setOptions([]);
  }

  function updateCustomer(field: keyof CustomerForm, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function toggleOption(option: OptionId) {
    setOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  function loadCurrentScenario(scenario: (typeof currentItemScenarios)[number]) {
    setForm(scenario.form);
    setOptions(scenario.options);
    setRoom(scenario.room);
    setQuantity(String(scenario.quantity));
    setToast(`Loaded ${scenario.label}.`);
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadWholeHomeQuote() {
    setLoadingDemo(true);
    setGenerated(false);
    setApprovalState("none");
    try {
      const lines = await Promise.all(
        wholeHomeDemo.map(async (demo) => {
          const response = await fetch("/api/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(demo.payload),
          });
          const quoteResult = (await response.json()) as QuoteResult;
          if (!quoteResult.valid) return null;
          return lineFromResult(
            demo.room,
            demo.quantity,
            demo.payload,
            quoteResult,
          );
        }),
      );
      const validLines = lines.filter((line): line is QuoteLineItem => line !== null);
      setQuoteItems(validLines);
      setDiscountPercent("5");
      setDepositPercent("50");
      setCustomer(initialCustomer);
      setToast(`Loaded a ${validLines.length}-room quote with ${validLines.reduce((sum, line) => sum + line.quantity, 0)} units.`);
      window.setTimeout(() => {
        document.getElementById("quote-cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } finally {
      setLoadingDemo(false);
    }
  }

  function addCurrentItem() {
    if (!result?.valid) {
      setToast("Fix the configuration before adding it to the quote.");
      return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const line = lineFromResult(room || "Unassigned", qty, payload, result);
    setQuoteItems((current) => [...current, line]);
    setApprovalState("none");
    setGenerated(false);
    setToast(`${line.room}: ${line.productLabel} added to the quote.`);
  }

  function updateLineQuantity(id: string, value: number) {
    setQuoteItems((current) =>
      current.map((line) =>
        line.id === id ? { ...line, quantity: Math.max(1, Math.floor(value || 1)) } : line,
      ),
    );
    setApprovalState("none");
    setGenerated(false);
  }

  function removeLine(id: string) {
    setQuoteItems((current) => current.filter((line) => line.id !== id));
    setApprovalState("none");
    setGenerated(false);
  }

  function duplicateLine(id: string) {
    const source = quoteItems.find((line) => line.id === id);
    if (!source) return;
    setQuoteItems((current) => [
      ...current,
      { ...source, id: makeLineId(), room: `${source.room} copy` },
    ]);
    setApprovalState("none");
    setGenerated(false);
  }

  function updateDiscount(value: string) {
    setDiscountPercent(value);
    setApprovalState("none");
    setGenerated(false);
  }

  function requestApproval() {
    if (!commercials.approvalRequired) return;
    setApprovalState("pending");
    setToast("Discount exception sent for manager approval (demo workflow).");
  }

  function approveException() {
    if (!commercials.approvalRequired) return;
    setApprovalState("approved");
    setToast("Manager exception approved for this demo quote.");
  }

  function generateQuote() {
    if (!canFinalize) {
      setToast(
        quoteItems.length === 0
          ? "Add at least one item first."
          : "Resolve the margin approval before generating the quote.",
      );
      return;
    }
    setGenerated(true);
    setToast("Customer quote generated.");
    window.setTimeout(() => {
      document.getElementById("customer-quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function saveQuote() {
    if (quoteItems.length === 0) {
      setToast("Add at least one item before saving.");
      return;
    }
    const key = "supplier-pricing-engine:v5-saved-quotes";
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    const snapshot = {
      quoteNumber,
      createdAt: new Date().toISOString(),
      customer,
      quoteItems,
      discountPercent: Number(discountPercent),
      depositPercent: Number(depositPercent),
      approvalState,
      commercials,
    };
    window.localStorage.setItem(key, JSON.stringify([snapshot, ...existing].slice(0, 25)));
    setToast(`${quoteNumber} saved to this browser.`);
  }

  function downloadPdf() {
    if (!canFinalize) {
      setToast("Generate an approved quote before downloading the PDF.");
      return;
    }

    const lines = [
      "SUPPLIER PRICING ENGINE - CUSTOMER QUOTE",
      "",
      `Quote: ${quoteNumber}`,
      `Customer: ${customer.customerName || "Not provided"}`,
      `Project: ${customer.projectName || "Not provided"}`,
      `Email: ${customer.email || "Not provided"}`,
      `Phone: ${customer.phone || "Not provided"}`,
      `Salesperson: ${customer.salesperson || "Not provided"}`,
      `Valid through: ${expiresLabel}`,
      "",
      "ITEMS",
      ...quoteItems.flatMap((line, index) => [
        `${index + 1}. ${line.room} - ${line.productLabel} (${line.supplierName})`,
        `   ${line.normalizedWidth} x ${line.normalizedHeight} in | ${line.fabricLabel} | ${line.controlLabel} | Qty ${line.quantity}`,
        `   Unit ${money.format(line.unitSellPrice)} | Line ${money.format(line.unitSellPrice * line.quantity)}`,
      ]),
      "",
      `Subtotal: ${money.format(commercials.subtotal)}`,
      `Discount (${clampDisplayPercent(discountPercent)}%): -${money.format(commercials.discountAmount)}`,
      `QUOTE TOTAL: ${money.format(commercials.netPrice)}`,
      `Deposit (${clampDisplayPercent(depositPercent)}%): ${money.format(commercials.depositAmount)}`,
      `Balance: ${money.format(commercials.balanceDue)}`,
      "",
      `Pricing provenance is preserved per line item.`,
      ...quoteItems.map((line) => `${line.room}: ${line.ruleVersion} / ${line.gridVersion}`),
    ];

    const blob = createTextPdf(lines);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quoteNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast("PDF downloaded.");
  }

  const currentProfit = result?.valid
    ? result.pricing.sellPrice - result.pricing.trueCost
    : 0;

  return (
    <main className="v5-shell">
      {toast ? <div className="v5-toast">{toast}</div> : null}

      <nav className="v5-nav">
        <a className="v5-brand" href="#top">
          <span className="v5-brand-mark">SP</span>
          <span>
            <strong>Supplier Pricing Engine</strong>
            <small>Multi-line CPQ quote studio</small>
          </span>
        </a>
        <div className="v5-nav-links">
          <a href="#builder">Builder</a>
          <a href="#quote-cart">Quote</a>
          <a href="#audit">Rules & audit</a>
          <a href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </nav>

      <header className="v5-hero" id="top">
        <div className="v5-hero-copy">
          <span className="v5-kicker">LIVE CPQ PRODUCT DEMO · V5</span>
          <h1>Build the whole job. <em>Not just one price.</em></h1>
          <p>
            Configure every window, catch bad combinations before they become orders,
            protect margin, and turn the approved job into a customer-ready quote.
          </p>
          <div className="v5-hero-actions">
            <button className="v5-primary" type="button" onClick={loadWholeHomeQuote} disabled={loadingDemo}>
              {loadingDemo ? "Building demo…" : "Load 3-room demo"}
            </button>
            <button className="v5-secondary" type="button" onClick={() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" })}>
              Build one item
            </button>
          </div>
          <div className="v5-value-strip">
            <span>3 suppliers</span>
            <span>9 product programs</span>
            <span>multi-room quotes</span>
            <span>margin guardrails</span>
            <span>PDF + audit trail</span>
          </div>
        </div>

        <aside className="v5-live-card" aria-label="Live quote summary">
          <div className="v5-live-head">
            <div>
              <small>LIVE QUOTE</small>
              <strong>{quoteNumber}</strong>
            </div>
            <span className={`v5-status ${quoteStatus.includes("Approval") ? "warn" : quoteStatus === "Generated" || quoteStatus === "Ready to send" ? "good" : ""}`}>
              {quoteStatus}
            </span>
          </div>
          <div className="v5-live-total">
            <span>Current total</span>
            <strong>{money.format(commercials.netPrice)}</strong>
            <small>{quoteItems.length} line item{quoteItems.length === 1 ? "" : "s"} · {quoteItems.reduce((sum, line) => sum + line.quantity, 0)} units</small>
          </div>
          <div className="v5-live-grid">
            <Metric label="Gross profit" value={money.format(commercials.grossProfit)} />
            <Metric label="Realized margin" value={`${(commercials.realizedMargin * 100).toFixed(1)}%`} />
            <Metric label="Deposit" value={money.format(commercials.depositAmount)} />
            <Metric label="Balance" value={money.format(commercials.balanceDue)} />
          </div>
          <div className="v5-live-note">
            <span className="v5-live-dot" />
            Every line keeps its supplier rule version and price-table version.
          </div>
        </aside>
      </header>

      <section className="v5-flow" aria-label="CPQ workflow">
        <FlowStep n="01" title="Job" text="Customer + project" />
        <FlowStep n="02" title="Configure" text="Product + dimensions" />
        <FlowStep n="03" title="Build" text="Rooms + quantities" />
        <FlowStep n="04" title="Protect" text="Margin + approval" />
        <FlowStep n="05" title="Quote" text="PDF + audit" />
      </section>

      <section className="v5-demo-strip">
        <div>
          <span className="v5-kicker">PROVE IT FAST</span>
          <h2>Click a scenario and watch the rules change.</h2>
        </div>
        <div className="v5-scenario-grid">
          {currentItemScenarios.map((scenario) => (
            <button key={scenario.id} type="button" onClick={() => loadCurrentScenario(scenario)}>
              <small>{scenario.note}</small>
              <strong>{scenario.label}</strong>
              <span>Load →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="v5-job-card">
        <div className="v5-section-title">
          <div>
            <span className="v5-kicker">JOB</span>
            <h2>Customer & project</h2>
          </div>
          <div className="v5-quote-meta">
            <span>{quoteNumber}</span>
            <small>Valid through {expiresLabel}</small>
          </div>
        </div>
        <div className="v5-job-grid">
          <V5Field label="Customer">
            <input value={customer.customerName} onChange={(event) => updateCustomer("customerName", event.target.value)} />
          </V5Field>
          <V5Field label="Project">
            <input value={customer.projectName} onChange={(event) => updateCustomer("projectName", event.target.value)} />
          </V5Field>
          <V5Field label="Email">
            <input type="email" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} />
          </V5Field>
          <V5Field label="Phone">
            <input value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} />
          </V5Field>
          <V5Field label="Salesperson">
            <input value={customer.salesperson} onChange={(event) => updateCustomer("salesperson", event.target.value)} />
          </V5Field>
        </div>
      </section>

      <section className="v5-builder-grid" id="builder">
        <div className="v5-card v5-config-card">
          <div className="v5-section-title">
            <div>
              <span className="v5-kicker">CURRENT ITEM</span>
              <h2>Configure one window</h2>
              <p>Price one item, then add it to the job.</p>
            </div>
            <span className="v5-supplier-pill">{supplier.name}</span>
          </div>

          <div className="v5-fields-2">
            <V5Field label="Room / location">
              <input value={room} onChange={(event) => setRoom(event.target.value)} />
            </V5Field>
            <V5Field label="Quantity">
              <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </V5Field>
            <V5Field label="Supplier">
              <select value={form.supplier} onChange={(event) => changeSupplier(event.target.value as SupplierId)}>
                <option value="alpha">Supplier Alpha</option>
                <option value="beta">Supplier Beta</option>
                <option value="gamma">Supplier Gamma</option>
              </select>
            </V5Field>
            <V5Field label="Product">
              <select value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value as ProductId }))}>
                {supplier.products.map((product) => <option key={product.id} value={product.id}>{product.label}</option>)}
              </select>
            </V5Field>
            <V5Field label="Width (in)">
              <input type="number" step="0.01" value={form.width} onChange={(event) => setForm((current) => ({ ...current, width: event.target.value }))} />
            </V5Field>
            <V5Field label="Height (in)">
              <input type="number" step="0.01" value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} />
            </V5Field>
            <V5Field label="Fabric">
              <select value={form.fabric} onChange={(event) => setForm((current) => ({ ...current, fabric: event.target.value }))}>
                {supplier.fabrics.map((fabric) => <option key={fabric.id} value={fabric.id}>{fabric.label}</option>)}
              </select>
            </V5Field>
            <V5Field label="Control">
              <select value={form.controlType} onChange={(event) => setForm((current) => ({ ...current, controlType: event.target.value }))}>
                {supplier.controls.map((control) => <option key={control.id} value={control.id}>{control.label}</option>)}
              </select>
            </V5Field>
            <V5Field label="Target margin (%)">
              <input type="number" min="1" max="99" step="0.5" value={form.targetMargin} onChange={(event) => setForm((current) => ({ ...current, targetMargin: event.target.value }))} />
            </V5Field>
          </div>

          <div className="v5-options">
            <span>Options</span>
            <div>
              {supplier.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={options.includes(option.id) ? "selected" : ""}
                  onClick={() => toggleOption(option.id)}
                >
                  <b>{options.includes(option.id) ? "✓" : "+"}</b>
                  <span>{option.label}</span>
                  <small>{option.fixedSurcharge === 0 ? "Included" : `+${money.format(option.fixedSurcharge)}`}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="v5-rule-chips">
            <span>{supplier.dimensions.minWidth}–{supplier.dimensions.maxWidth}&quot; W</span>
            <span>{supplier.dimensions.minHeight}–{supplier.dimensions.maxHeight}&quot; H</span>
            <span>{supplier.dimensions.roundingIncrement}&quot; rounding</span>
            <span>{supplier.gridVersion}</span>
          </div>
        </div>

        <div className="v5-card v5-price-card">
          <div className="v5-section-title">
            <div>
              <span className="v5-kicker">RULE ENGINE</span>
              <h2>Live item price</h2>
              <p>Invalid combinations stop here—before they become order problems.</p>
            </div>
            {loading ? (
              <span className="v5-status">Checking…</span>
            ) : result?.valid ? (
              <span className="v5-status good">✓ Valid</span>
            ) : (
              <span className="v5-status bad">× Blocked</span>
            )}
          </div>

          {result?.valid ? (
            <>
              <div className="v5-price-hero">
                <div>
                  <span>Unit sell price</span>
                  <strong>{money.format(result.pricing.sellPrice)}</strong>
                  <small>{(result.pricing.targetMargin * 100).toFixed(1)}% target margin</small>
                </div>
                <div>
                  <span>Unit gross profit</span>
                  <strong>{money.format(currentProfit)}</strong>
                  <small>Cost {money.format(result.pricing.trueCost)}</small>
                </div>
              </div>

              <div className="v5-normalization">
                <span>You entered <b>{form.width}&quot; × {form.height}&quot;</b></span>
                <span className="arrow">→</span>
                <span>Supplier prices <b>{result.normalizedDimensions.width}&quot; × {result.normalizedDimensions.height}&quot;</b></span>
              </div>

              <div className="v5-breakdown">
                <MoneyRow label="Price-grid base" value={result.pricing.gridBaseCost} />
                {result.pricing.productAdjustment > 0 ? <MoneyRow label={`${activeProduct?.label ?? "Product"} program`} value={result.pricing.productAdjustment} plus /> : null}
                <MoneyRow label={activeFabric?.label ?? "Fabric"} value={result.pricing.fabricSurcharge} plus />
                <MoneyRow label={activeControl?.label ?? "Control"} value={result.pricing.controlSurcharge} plus />
                <MoneyRow label="Options" value={result.pricing.optionSurcharge} plus />
                <MoneyRow label="Shipping" value={result.pricing.freight} plus />
                <MoneyRow label="True landed cost" value={result.pricing.trueCost} strong />
              </div>

              <button className="v5-add-button" type="button" onClick={addCurrentItem}>
                Add {Math.max(1, Number(quantity) || 1)} to quote · {money.format(result.pricing.sellPrice * Math.max(1, Number(quantity) || 1))}
              </button>
            </>
          ) : result ? (
            <div className="v5-blocked">
              <span>QUOTE BLOCKED</span>
              <h3>The engine caught a supplier-rule conflict.</h3>
              <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>
              <p>Change the size, fabric, control, product, or options. Pricing resumes automatically when the configuration is valid.</p>
            </div>
          ) : (
            <div className="v5-empty">Preparing pricing engine…</div>
          )}
        </div>
      </section>

      <section className="v5-quote-section" id="quote-cart">
        <div className="v5-section-title v5-quote-heading">
          <div>
            <span className="v5-kicker">THE JOB</span>
            <h2>Quote line items</h2>
            <p>Build the whole project across rooms, products, quantities, and suppliers.</p>
          </div>
          <div className="v5-quote-count">
            <strong>{quoteItems.reduce((sum, line) => sum + line.quantity, 0)}</strong>
            <span>total units</span>
          </div>
        </div>

        {quoteItems.length ? (
          <div className="v5-line-table">
            <div className="v5-line-header">
              <span>Room / product</span>
              <span>Supplier</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Line total</span>
              <span />
            </div>
            {quoteItems.map((line) => (
              <div className="v5-line" key={line.id}>
                <div>
                  <strong>{line.room}</strong>
                  <span>{line.productLabel} · {line.normalizedWidth}&quot; × {line.normalizedHeight}&quot;</span>
                  <small>{line.fabricLabel} · {line.controlLabel}{line.options.length ? ` · ${line.options.map(optionLabel).join(" · ")}` : ""}</small>
                </div>
                <span>{line.supplierName}</span>
                <input
                  aria-label={`Quantity for ${line.room}`}
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(event) => updateLineQuantity(line.id, Number(event.target.value))}
                />
                <strong>{money.format(line.unitSellPrice)}</strong>
                <strong>{money.format(line.unitSellPrice * line.quantity)}</strong>
                <div className="v5-line-actions">
                  <button type="button" onClick={() => duplicateLine(line.id)} title="Duplicate line">⧉</button>
                  <button type="button" onClick={() => removeLine(line.id)} title="Remove line">×</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="v5-empty-cart">
            <strong>No line items yet.</strong>
            <span>Configure a window above or load the 3-room demo.</span>
            <button type="button" className="v5-secondary" onClick={loadWholeHomeQuote}>Load 3-room demo</button>
          </div>
        )}
      </section>

      <section className="v5-commercial-grid">
        <div className="v5-card">
          <div className="v5-section-title">
            <div>
              <span className="v5-kicker">COMMERCIAL TERMS</span>
              <h2>Discount & payment</h2>
              <p>Price the whole job, not just individual units.</p>
            </div>
          </div>
          <div className="v5-fields-2 compact">
            <V5Field label="Quote discount (%)">
              <input type="number" min="0" max="100" step="0.5" value={discountPercent} onChange={(event) => updateDiscount(event.target.value)} />
            </V5Field>
            <V5Field label="Deposit due (%)">
              <input type="number" min="0" max="100" step="5" value={depositPercent} onChange={(event) => { setDepositPercent(event.target.value); setGenerated(false); }} />
            </V5Field>
          </div>
          <div className="v5-policy-row">
            <span>Margin floor</span>
            <strong>{(minimumMargin * 100).toFixed(0)}%</strong>
            <small>Quotes below this floor require manager approval.</small>
          </div>
        </div>

        <div className="v5-card v5-commercial-summary">
          <div className="v5-section-title">
            <div>
              <span className="v5-kicker">DEAL DESK</span>
              <h2>Quote economics</h2>
            </div>
            <span className={`v5-status ${commercials.approvalRequired ? approvalState === "approved" ? "good" : "warn" : quoteItems.length ? "good" : ""}`}>
              {quoteItems.length === 0
                ? "Waiting for items"
                : commercials.approvalRequired
                  ? approvalState === "approved"
                    ? "✓ Exception approved"
                    : "! Approval required"
                  : "✓ Within policy"}
            </span>
          </div>

          <div className="v5-economics-grid">
            <Metric label="Subtotal" value={money.format(commercials.subtotal)} />
            <Metric label="Discount" value={`-${money.format(commercials.discountAmount)}`} />
            <Metric label="Customer total" value={money.format(commercials.netPrice)} highlight />
            <Metric label="True cost" value={money.format(commercials.trueCost)} />
            <Metric label="Gross profit" value={money.format(commercials.grossProfit)} />
            <Metric label="Realized margin" value={`${(commercials.realizedMargin * 100).toFixed(1)}%`} highlight />
            <Metric label="Deposit due" value={money.format(commercials.depositAmount)} />
            <Metric label="Balance" value={money.format(commercials.balanceDue)} />
          </div>

          {commercials.approvalRequired && approvalState !== "approved" ? (
            <div className="v5-approval-box">
              <div>
                <span>MARGIN GUARD</span>
                <strong>{(commercials.realizedMargin * 100).toFixed(1)}% is below the 30% floor.</strong>
                <p>The quote can be built, but it cannot be finalized until the exception is approved.</p>
              </div>
              <div>
                <button type="button" className="v5-secondary" onClick={requestApproval} disabled={approvalState === "pending"}>
                  {approvalState === "pending" ? "Approval requested" : "Request approval"}
                </button>
                {approvalState === "pending" ? (
                  <button type="button" className="v5-primary" onClick={approveException}>Simulate manager approval</button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="v5-audit" id="audit">
        <div className="v5-section-title">
          <div>
            <span className="v5-kicker">RULES & AUDIT</span>
            <h2>Every dollar can be explained.</h2>
            <p>The current configuration shows the live calculation trace. Every added line keeps its own supplier rule and price-table versions.</p>
          </div>
          <span className="v5-supplier-pill">{supplier.ruleVersion}</span>
        </div>

        <div className="v5-audit-grid">
          <details open>
            <summary>Current item calculation trace</summary>
            <div className="v5-trace">
              {result?.trace.length ? result.trace.map((step, index) => (
                <div key={`${step.stage}-${index}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{stageNames[step.stage]}</strong>
                    <p>{step.message}</p>
                  </div>
                </div>
              )) : <p>No calculation trace yet.</p>}
            </div>
          </details>

          <details>
            <summary>Quote provenance by line item</summary>
            <div className="v5-provenance">
              {quoteItems.length ? quoteItems.map((line) => (
                <div key={line.id}>
                  <strong>{line.room}</strong>
                  <span>{line.supplierName} · {line.productLabel}</span>
                  <code>{line.ruleVersion}</code>
                  <code>{line.gridVersion}</code>
                </div>
              )) : <p>Add line items to see their rule versions.</p>}
            </div>
          </details>
        </div>
      </section>

      {generated && canFinalize ? (
        <section className="v5-customer-quote" id="customer-quote">
          <div className="v5-section-title">
            <div>
              <span className="v5-kicker">CUSTOMER-FACING OUTPUT</span>
              <h2>Ready to send</h2>
            </div>
            <span className="v5-status good">✓ Generated</span>
          </div>
          <div className="v5-paper">
            <div className="v5-paper-head">
              <div className="v5-paper-brand">
                <span>SP</span>
                <div><strong>Supplier Pricing Engine</strong><small>Professional quote</small></div>
              </div>
              <div><strong>{quoteNumber}</strong><span>Valid through {expiresLabel}</span></div>
            </div>
            <div className="v5-paper-parties">
              <div><small>PREPARED FOR</small><strong>{customer.customerName || "Customer"}</strong><span>{customer.projectName}</span><span>{customer.email}</span><span>{customer.phone}</span></div>
              <div><small>PREPARED BY</small><strong>{customer.salesperson || "Salesperson"}</strong><span>Supplier Pricing Engine demo</span></div>
            </div>
            <div className="v5-paper-table">
              <div className="head"><span>Room / product</span><span>Qty</span><span>Price</span></div>
              {quoteItems.map((line) => (
                <div key={line.id}>
                  <span><strong>{line.room}</strong><small>{line.productLabel} · {line.normalizedWidth}&quot; × {line.normalizedHeight}&quot; · {line.fabricLabel} · {line.controlLabel}</small></span>
                  <span>{line.quantity}</span>
                  <strong>{money.format(line.unitSellPrice * line.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="v5-paper-totals">
              <div><span>Subtotal</span><strong>{money.format(commercials.subtotal)}</strong></div>
              {commercials.discountAmount > 0 ? <div><span>Discount</span><strong>-{money.format(commercials.discountAmount)}</strong></div> : null}
              <div className="total"><span>Quote total</span><strong>{money.format(commercials.netPrice)}</strong></div>
              <div><span>Deposit due</span><strong>{money.format(commercials.depositAmount)}</strong></div>
              <div><span>Balance</span><strong>{money.format(commercials.balanceDue)}</strong></div>
            </div>
            <div className="v5-paper-fineprint">
              Pricing is backed by versioned supplier rules and price tables. Internal cost, margin, approval data, and calculation traces are intentionally excluded from the customer-facing quote.
            </div>
          </div>
        </section>
      ) : null}

      <section className="v5-action-bar">
        <div>
          <span>{quoteStatus}</span>
          <strong>{money.format(commercials.netPrice)}</strong>
        </div>
        <div>
          <button type="button" className="v5-primary" onClick={generateQuote} disabled={!canFinalize}>Generate customer quote</button>
          <button type="button" className="v5-secondary" onClick={saveQuote}>Save</button>
          <button type="button" className="v5-secondary" onClick={downloadPdf} disabled={!canFinalize}>Download PDF</button>
          <a className="v5-secondary v5-link-button" href="https://github.com/Kohronburton/supplier-pricing-engine" target="_blank" rel="noreferrer">Source ↗</a>
        </div>
      </section>

      <footer className="v5-footer">
        <div>
          <strong>Supplier Pricing Engine</strong>
          <span>Deterministic CPQ architecture · Next.js · TypeScript · automated regression tests</span>
        </div>
        <div>
          <span>Built by <a href="https://kohronburton.com" target="_blank" rel="noreferrer">Kohron Burton ↗</a></span>
        </div>
      </footer>
    </main>
  );
}

function V5Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="v5-field"><span>{label}</span>{children}</label>;
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className={highlight ? "v5-metric highlight" : "v5-metric"}><span>{label}</span><strong>{value}</strong></div>;
}

function MoneyRow({ label, value, plus = false, strong = false }: { label: string; value: number; plus?: boolean; strong?: boolean }) {
  const formatted = money.format(value);
  return <div className={strong ? "v5-money-row strong" : "v5-money-row"}><span>{label}</span><strong>{plus && value > 0 ? `+${formatted}` : formatted}</strong></div>;
}

function FlowStep({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="v5-flow-step"><span>{n}</span><div><strong>{title}</strong><small>{text}</small></div></div>;
}

function lineFromResult(
  room: string,
  quantity: number,
  payload: {
    supplier: SupplierId;
    product: ProductId;
    width: number;
    height: number;
    fabric: string;
    controlType: string;
    options: OptionId[];
  },
  result: Extract<QuoteResult, { valid: true }>,
): QuoteLineItem {
  const rules = supplierRuleSets[payload.supplier];
  const product = rules.products.find((item) => item.id === payload.product);
  const fabric = rules.fabrics.find((item) => item.id === payload.fabric);
  const control = rules.controls.find((item) => item.id === payload.controlType);
  return {
    id: makeLineId(),
    room,
    quantity: Math.max(1, quantity),
    supplier: payload.supplier,
    supplierName: rules.name,
    product: payload.product,
    productLabel: product?.label ?? payload.product,
    enteredWidth: payload.width,
    enteredHeight: payload.height,
    normalizedWidth: result.normalizedDimensions.width,
    normalizedHeight: result.normalizedDimensions.height,
    fabricLabel: fabric?.label ?? payload.fabric,
    controlLabel: control?.label ?? payload.controlType,
    options: payload.options,
    unitSellPrice: result.pricing.sellPrice,
    unitTrueCost: result.pricing.trueCost,
    ruleVersion: result.ruleVersion,
    gridVersion: result.gridVersion,
    trace: result.trace,
  };
}

function makeLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function optionLabel(id: OptionId): string {
  return id === "side-channel" ? "Side Channel" : id.charAt(0).toUpperCase() + id.slice(1);
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

function clampDisplayPercent(value: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

function createTextPdf(lines: string[]): Blob {
  const safeLines = lines.flatMap((line) => wrapPdfLine(line, 92)).slice(0, 54);
  const textCommands = safeLines
    .map((line, index) => `${index === 0 ? "" : "T* "}(${escapePdfText(toAscii(line))}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 9 Tf\n48 760 Td\n12 TL\n${textCommands}\nET`;
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
