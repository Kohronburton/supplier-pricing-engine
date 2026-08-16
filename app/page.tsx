"use client";

import { useEffect, useMemo, useState } from "react";
import type { OptionId, QuoteResult, SupplierId } from "@/src/domain/models";
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

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState<OptionId[]>(["cassette"]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);

  const supplier = supplierRuleSets[form.supplier];

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
      setForm((current) => ({
        ...current,
        supplier: nextSupplier,
        targetMargin: String(
          Math.round(supplierRuleSets[nextSupplier].defaultTargetMargin * 100),
        ),
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

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <div className="eyebrow">REFERENCE IMPLEMENTATION · CPQ / RULE ENGINE</div>
          <h1>Supplier Pricing Engine</h1>
          <p>
            One deterministic quoting pipeline. Different supplier rules, grids,
            compatibility constraints, surcharges, freight policies, and margins.
          </p>
        </div>
        <div className="hero-badge">
          <span className="pulse" />
          Live rule evaluation
        </div>
      </header>

      <section className="principle">
        <div className="principle-icon">01</div>
        <div>
          <strong>Supplier behavior is configuration, not application logic.</strong>
          <span>
            Add or version a supplier rule set without rewriting the core pricing pipeline.
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
              <span className="step">CONFIGURE</span>
              <h2>Product Configuration</h2>
            </div>
            <span className="supplier-chip">{supplier.name}</span>
          </div>

          <div className="form-grid">
            <label>
              <span>Supplier</span>
              <select
                value={form.supplier}
                onChange={(event) => updateField("supplier", event.target.value)}
              >
                <option value="alpha">Supplier Alpha</option>
                <option value="beta">Supplier Beta</option>
                <option value="gamma">Supplier Gamma</option>
              </select>
            </label>

            <label>
              <span>Product</span>
              <select value="roller-shade" disabled>
                <option>Roller Shade</option>
              </select>
            </label>

            <label>
              <span>Width (in)</span>
              <input
                type="number"
                step="0.01"
                value={form.width}
                onChange={(event) => updateField("width", event.target.value)}
              />
            </label>

            <label>
              <span>Height (in)</span>
              <input
                type="number"
                step="0.01"
                value={form.height}
                onChange={(event) => updateField("height", event.target.value)}
              />
            </label>

            <label>
              <span>Fabric</span>
              <select
                value={form.fabric}
                onChange={(event) => updateField("fabric", event.target.value)}
              >
                {supplier.fabrics.map((fabric) => (
                  <option key={fabric.id} value={fabric.id}>
                    {fabric.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Control</span>
              <select
                value={form.controlType}
                onChange={(event) => updateField("controlType", event.target.value)}
              >
                {supplier.controls.map((control) => (
                  <option key={control.id} value={control.id}>
                    {control.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="margin-field">
              <span>Target Margin (%)</span>
              <input
                type="number"
                min="1"
                max="99"
                step="0.5"
                value={form.targetMargin}
                onChange={(event) => updateField("targetMargin", event.target.value)}
              />
            </label>
          </div>

          <div className="options-block">
            <span className="field-label">Options</span>
            <div className="option-grid">
              {supplier.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={options.includes(option.id) ? "option selected" : "option"}
                  onClick={() => toggleOption(option.id)}
                >
                  <span className="option-check">
                    {options.includes(option.id) ? "✓" : "+"}
                  </span>
                  <span>
                    <strong>{option.label}</strong>
                    <small>
                      {option.fixedSurcharge === 0
                        ? "Included"
                        : `+${money.format(option.fixedSurcharge)}`}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="supplier-policy">
            <span>Active supplier policy</span>
            <div>
              <code>
                {supplier.dimensions.minWidth}–{supplier.dimensions.maxWidth}&quot; W
              </code>
              <code>
                {supplier.dimensions.minHeight}–{supplier.dimensions.maxHeight}&quot; H
              </code>
              <code>{supplier.dimensions.roundingIncrement}&quot; rounding</code>
            </div>
          </div>
        </div>

        <div className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <span className="step">PRICE</span>
              <h2>Quote Analysis</h2>
            </div>
            {loading ? (
              <span className="status neutral">Evaluating…</span>
            ) : result?.valid ? (
              <span className="status valid">✓ Valid configuration</span>
            ) : (
              <span className="status invalid">× Invalid configuration</span>
            )}
          </div>

          {result?.valid ? (
            <>
              <div className="normalized-card">
                <span>Normalized supplier dimensions</span>
                <strong>
                  {result.normalizedDimensions.width}&quot; × {result.normalizedDimensions.height}&quot;
                </strong>
                <small>after {supplier.dimensions.roundingIncrement}&quot; rounding policy</small>
              </div>

              <div className="breakdown">
                <PriceRow label="Base grid cost" value={result.pricing.baseCost} />
                <PriceRow label="Fabric surcharge" value={result.pricing.fabricSurcharge} />
                <PriceRow label="Control / motor" value={result.pricing.controlSurcharge} />
                <PriceRow label="Options" value={result.pricing.optionSurcharge} />
                <PriceRow label="Freight" value={result.pricing.freight} />
                <div className="rule" />
                <PriceRow label="True landed cost" value={result.pricing.trueCost} emphasis />
              </div>

              <div className="sell-card">
                <div>
                  <span>Target margin</span>
                  <strong>{(result.pricing.targetMargin * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>Sell price</span>
                  <strong>{money.format(result.pricing.sellPrice)}</strong>
                </div>
              </div>
            </>
          ) : result ? (
            <div className="error-card">
              <span className="error-kicker">CONFIGURATION BLOCKED</span>
              <h3>This combination cannot be quoted.</h3>
              <ul>
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              <p>Change the configuration and the engine will re-evaluate automatically.</p>
            </div>
          ) : (
            <div className="empty-card">Preparing quote engine…</div>
          )}
        </div>
      </section>

      <section className="trace-panel">
        <div className="trace-heading">
          <div>
            <span className="step">EXPLAIN</span>
            <h2>Calculation Trace</h2>
          </div>
          <span>Deterministic · auditable · testable</span>
        </div>

        <div className="trace-list">
          {result?.trace.length ? (
            result.trace.map((item, index) => (
              <div className="trace-item" key={`${item.stage}-${index}`}>
                <span className={result.valid ? "trace-dot" : "trace-dot warn"}>
                  {index + 1}
                </span>
                <div>
                  <strong>{item.stage}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="trace-empty">No calculation steps yet.</p>
          )}
        </div>
      </section>

      <footer>
        <span>Supplier Pricing Engine · CPQ Architecture Demo</span>
        <span>
          Rule set <code>{supplier.ruleVersion}</code> · Grid <code>{supplier.gridVersion}</code>
        </span>
      </footer>
    </main>
  );
}

function PriceRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className={emphasis ? "price-row emphasis" : "price-row"}>
      <span>{label}</span>
      <strong>{money.format(value)}</strong>
    </div>
  );
}
