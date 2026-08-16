"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalculationTraceStep, OptionId, QuoteResult, SupplierId } from "@/src/domain/models";
import { supplierRuleSets } from "@/src/suppliers/rules";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const initialForm = {
  supplier: "alpha" as SupplierId,
  width: "73.25",
  height: "80.10",
  fabric: "premium",
  controlType: "motorized",
  targetMargin: "38",
};

const stageNames: Record<CalculationTraceStep["stage"], string> = {
  validation: "Size check",
  compatibility: "Option check",
  rounding: "Rounding",
  grid: "Price table",
  surcharge: "Extras",
  freight: "Shipping",
  margin: "Selling price",
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState<OptionId[]>(["cassette"]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);

  const supplier = supplierRuleSets[form.supplier];
  const activeControl = supplier.controls.find((item) => item.id === form.controlType);
  const activeFabric = supplier.fabrics.find((item) => item.id === form.fabric);

  const payload = useMemo(
    () => ({
      supplier: form.supplier,
      product: "roller-shade" as const,
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
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [payload]);

  function updateField(field: keyof typeof form, value: string) {
    if (field === "supplier") {
      const nextSupplier = value as SupplierId;
      const nextRules = supplierRuleSets[nextSupplier];
      setForm((current) => ({
        ...current,
        supplier: nextSupplier,
        targetMargin: String(Math.round(nextRules.defaultTargetMargin * 100)),
      }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleOption(option: OptionId) {
    setOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  const roundedWidth = roundUp(Number(form.width), supplier.dimensions.roundingIncrement);
  const roundedHeight = roundUp(Number(form.height), supplier.dimensions.roundingIncrement);
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
    <main className="shell v3-shell">
      <header className="hero v3-hero">
        <div>
          <div className="eyebrow">V3 · SIMPLE QUOTING DEMO</div>
          <h1>Supplier Pricing Engine</h1>
          <p className="hero-lead">
            Build a correct quote, even when every supplier has different pricing rules.
          </p>
          <p className="hero-subcopy">
            Choose the product details. The system checks the rules, finds the right cost,
            adds fees, and calculates the selling price.
          </p>
        </div>
        <div className="hero-badge">
          <span className="pulse" />
          Rules checked live
        </div>
      </header>

      <section className="principle v3-principle">
        <div className="principle-icon">01</div>
        <div>
          <strong>One pricing system. Different supplier rules.</strong>
          <span>
            Size limits, rounding, fabrics, motors, options, price tables, extra fees, and shipping can all change by supplier.
          </span>
        </div>
        <div className="version-stack">
          <code>{supplier.ruleVersion}</code>
          <code>{supplier.gridVersion}</code>
        </div>
      </section>

      <section className="workspace">
        <div className="panel configurator">
          <div className="panel-heading">
            <div>
              <span className="step">BUILD YOUR QUOTE</span>
              <h2>Product Details</h2>
              <p className="section-help">Choose the supplier and tell us what the customer wants.</p>
            </div>
            <span className="supplier-chip">{supplier.name}</span>
          </div>

          <div className="form-grid">
            <Field label="Supplier" help="Which company are we buying from?">
              <select value={form.supplier} onChange={(event) => updateField("supplier", event.target.value)}>
                <option value="alpha">Supplier Alpha</option>
                <option value="beta">Supplier Beta</option>
                <option value="gamma">Supplier Gamma</option>
              </select>
            </Field>

            <Field label="Product" help="What are we selling?">
              <select value="roller-shade" disabled>
                <option>Roller Shade</option>
              </select>
            </Field>

            <Field label="Width (in)" help="How wide is it?">
              <input type="number" step="0.01" value={form.width} onChange={(event) => updateField("width", event.target.value)} />
            </Field>

            <Field label="Height (in)" help="How tall is it?">
              <input type="number" step="0.01" value={form.height} onChange={(event) => updateField("height", event.target.value)} />
            </Field>

            <Field label="Fabric" help="Which fabric does the customer want?">
              <select value={form.fabric} onChange={(event) => updateField("fabric", event.target.value)}>
                {supplier.fabrics.map((fabric) => (
                  <option key={fabric.id} value={fabric.id}>{fabric.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Control" help="How will the shade open and close?">
              <select value={form.controlType} onChange={(event) => updateField("controlType", event.target.value)}>
                {supplier.controls.map((control) => (
                  <option key={control.id} value={control.id}>{control.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Target Margin (%)" help="How much profit do we want to keep?" className="margin-field">
              <input type="number" min="1" max="99" step="0.5" value={form.targetMargin} onChange={(event) => updateField("targetMargin", event.target.value)} />
            </Field>
          </div>

          <div className="options-block">
            <span className="field-label">Options</span>
            <span className="field-help standalone">Add any extras the customer wants.</span>
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

          <div className="supplier-policy simple-policy">
            <span>Rules being used right now</span>
            <div>
              <code>{supplier.dimensions.minWidth}–{supplier.dimensions.maxWidth}&quot; wide</code>
              <code>{supplier.dimensions.minHeight}–{supplier.dimensions.maxHeight}&quot; tall</code>
              <code>round up by {supplier.dimensions.roundingIncrement}&quot;</code>
            </div>
          </div>
        </div>

        <div className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <span className="step">YOUR PRICE</span>
              <h2>Quote</h2>
              <p className="section-help">The system checks the supplier rules and builds the price.</p>
            </div>
            {loading ? (
              <span className="status neutral">Checking…</span>
            ) : result?.valid ? (
              <span className="status valid">✓ This configuration works</span>
            ) : (
              <span className="status invalid">× This setup will not work</span>
            )}
          </div>

          {result?.valid ? (
            <>
              <div className="normalized-card simple-normalized">
                <div>
                  <span>Supplier size used</span>
                  <small>You entered {form.width}&quot; × {form.height}&quot;</small>
                </div>
                <strong>{result.normalizedDimensions.width}&quot; × {result.normalizedDimensions.height}&quot;</strong>
                <p>Why? {supplier.name} rounds up by {supplier.dimensions.roundingIncrement}&quot;.</p>
              </div>

              <div className="breakdown">
                <PriceRow label="Base product" value={result.pricing.baseCost} />
                <PriceRow label={activeFabric?.label ? `${activeFabric.label} fabric` : "Fabric"} value={result.pricing.fabricSurcharge} prefix />
                <PriceRow label={activeControl?.label ?? "Control / motor"} value={result.pricing.controlSurcharge} prefix />
                <PriceRow label="Options" value={result.pricing.optionSurcharge} prefix />
                <PriceRow label="Shipping" value={result.pricing.freight} prefix />
                <div className="rule" />
                <PriceRow label="Our total cost" value={result.pricing.trueCost} emphasis />
              </div>

              <div className="sell-card simple-sell-card">
                <div>
                  <span>Profit margin</span>
                  <strong>{(result.pricing.targetMargin * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>Customer price</span>
                  <strong>{money.format(result.pricing.sellPrice)}</strong>
                </div>
              </div>
            </>
          ) : result ? (
            <div className="error-card simple-error-card">
              <span className="error-kicker">THIS SETUP WILL NOT WORK</span>
              <h3>One or more supplier rules are being broken.</h3>
              <ul>
                {result.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
              <div className="fix-box">
                <strong>How to fix it</strong>
                {fixIdeas.length ? (
                  <ul>{fixIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
                ) : (
                  <p>Change the size, fabric, control, or options. The price will update automatically.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-card">Preparing the quote…</div>
          )}
        </div>
      </section>

      <RuleInspector supplier={supplier} roundedWidth={roundedWidth} roundedHeight={roundedHeight} formWidth={form.width} formHeight={form.height} />

      <section className="trace-panel v3-trace-panel">
        <div className="trace-heading">
          <div>
            <span className="step">HOW WE GOT THIS PRICE</span>
            <h2>Every Step, In Plain English</h2>
          </div>
          <span>Easy to check · easy to explain</span>
        </div>

        <div className="trace-list">
          {result?.trace.length ? (
            result.trace.map((item, index) => (
              <div className="trace-item" key={`${item.stage}-${index}`}>
                <span className={result.valid ? "trace-dot" : "trace-dot warn"}>{index + 1}</span>
                <div>
                  <strong>{stageNames[item.stage]}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="trace-empty">No price steps yet.</p>
          )}
        </div>
      </section>

      <section className="bottom-message">
        <strong>Easy to change. Easy to check. Easy to explain.</strong>
        <p>Supplier rules stay separate from the main pricing engine, so a new supplier can be added without rebuilding the whole app.</p>
      </section>

      <footer>
        <span>Supplier Pricing Engine · V3 CPQ Demo</span>
        <span>Rule set <code>{supplier.ruleVersion}</code> · Price table <code>{supplier.gridVersion}</code></span>
      </footer>
    </main>
  );
}

function Field({
  label,
  help,
  className,
  children,
}: {
  label: string;
  help: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <small className="field-help">{help}</small>
      {children}
    </label>
  );
}

function RuleInspector({
  supplier,
  roundedWidth,
  roundedHeight,
  formWidth,
  formHeight,
}: {
  supplier: (typeof supplierRuleSets)[SupplierId];
  roundedWidth: number;
  roundedHeight: number;
  formWidth: string;
  formHeight: string;
}) {
  const motorRules = supplier.controls.filter((control) => control.id !== "manual");

  return (
    <section className="rule-inspector">
      <div className="rule-inspector-heading">
        <div>
          <span className="step">SUPPLIER RULES</span>
          <h2>These are the rules being used right now.</h2>
          <p>You do not have to search a supplier manual. The system checks these rules automatically.</p>
        </div>
        <span className="supplier-chip">{supplier.name}</span>
      </div>

      <div className="rule-grid">
        <RuleCard title="Size Rules" subtitle="What sizes are allowed?">
          <Stat label="Smallest width" value={`${supplier.dimensions.minWidth}\"`} />
          <Stat label="Largest width" value={`${supplier.dimensions.maxWidth}\"`} />
          <Stat label="Smallest height" value={`${supplier.dimensions.minHeight}\"`} />
          <Stat label="Largest height" value={`${supplier.dimensions.maxHeight}\"`} />
        </RuleCard>

        <RuleCard title="Rounding" subtitle={`Round up by ${supplier.dimensions.roundingIncrement} inch${supplier.dimensions.roundingIncrement === 1 ? "" : "es"}`}>
          <div className="rounding-demo">
            <span>{formWidth || "0"}&quot; × {formHeight || "0"}&quot;</span>
            <b>→</b>
            <strong>{roundedWidth}&quot; × {roundedHeight}&quot;</strong>
          </div>
          <p className="rule-note">The supplier prices the rounded size, not the raw measurement.</p>
        </RuleCard>

        <RuleCard title="Motor Rules" subtitle="Motor price and minimum width">
          {motorRules.map((control) => (
            <div className="rule-line" key={control.id}>
              <div><strong>{control.label}</strong><small>{control.minWidth ? `Minimum width: ${control.minWidth}\"` : "No special minimum"}</small></div>
              <b>+{money.format(control.fixedSurcharge)}</b>
            </div>
          ))}
        </RuleCard>

        <RuleCard title="Fabric Rules" subtitle="What each fabric adds">
          {supplier.fabrics.map((fabric) => {
            const percent = Math.round((fabric.multiplier - 1) * 100);
            return (
              <div className="rule-line" key={fabric.id}>
                <div><strong>{fabric.label}</strong><small>{percent === 0 ? "No extra charge" : `Adds ${percent}%`}</small></div>
                <b>{percent === 0 ? "Included" : `+${percent}%`}</b>
              </div>
            );
          })}
        </RuleCard>

        <RuleCard title="Shipping Rules" subtitle="Base shipping plus special handling">
          <div className="rule-line"><div><strong>Normal shipping</strong><small>Starts on every valid quote</small></div><b>{money.format(supplier.baseFreight)}</b></div>
          {supplier.freightRules.map((rule) => (
            <div className="rule-line" key={rule.id}>
              <div>
                <strong>{rule.label}</strong>
                <small>{freightCondition(rule.minWidth, rule.minHeight)}</small>
              </div>
              <b>+{money.format(rule.amount)}</b>
            </div>
          ))}
        </RuleCard>

        <RuleCard title="Pricing Version" subtitle="Which rules and price table are active?">
          <Stat label="Rule version" value={supplier.ruleVersion} mono />
          <Stat label="Price table" value={supplier.gridVersion} mono />
          <Stat label="Started" value={formatDate(supplier.effectiveFrom)} />
          <div className="why-box">
            <strong>Why this matters</strong>
            <p>Supplier prices change. Saving the version tells us exactly how an older quote was calculated.</p>
          </div>
        </RuleCard>
      </div>
    </section>
  );
}

function RuleCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <article className="rule-card">
      <div className="rule-card-title"><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="rule-card-body">{children}</div>
    </article>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="stat-row"><span>{label}</span>{mono ? <code>{value}</code> : <strong>{value}</strong>}</div>;
}

function PriceRow({ label, value, emphasis = false, prefix = false }: { label: string; value: number; emphasis?: boolean; prefix?: boolean }) {
  return (
    <div className={emphasis ? "price-row emphasis" : "price-row"}>
      <span>{label}</span>
      <strong>{prefix && value > 0 ? "+" : ""}{money.format(value)}</strong>
    </div>
  );
}

function roundUp(value: number, increment: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / increment) * increment;
}

function freightCondition(minWidth?: number, minHeight?: number) {
  if (minWidth && minHeight) return `Applies above ${minWidth - 0.01}\" wide or ${minHeight - 0.01}\" tall`;
  if (minWidth) return `Applies when width is over ${(minWidth - 0.01).toFixed(0)}\"`;
  if (minHeight) return `Applies when height is over ${(minHeight - 0.01).toFixed(0)}\"`;
  return "Applies when this supplier rule is triggered";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
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
}) {
  const ideas: string[] = [];
  if (Number.isFinite(input.width) && input.width < input.minWidth) ideas.push(`Increase the width to at least ${input.minWidth}\".`);
  if (Number.isFinite(input.width) && input.width > input.maxWidth) ideas.push(`Reduce the width to ${input.maxWidth}\" or less.`);
  if (Number.isFinite(input.height) && input.height < input.minHeight) ideas.push(`Increase the height to at least ${input.minHeight}\".`);
  if (Number.isFinite(input.height) && input.height > input.maxHeight) ideas.push(`Reduce the height to ${input.maxHeight}\" or less.`);
  if (input.controlMinWidth && Number.isFinite(input.width) && input.width < input.controlMinWidth) {
    ideas.push(`${input.controlLabel ?? "This control"} needs at least ${input.controlMinWidth}\" of width. Increase the width or choose Manual.`);
  }
  return ideas;
}
