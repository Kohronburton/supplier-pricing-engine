# Adding a Supplier Without Rewriting the Engine

The engine is designed around a supplier-agnostic calculation pipeline. New supplier behavior is expressed through a `SupplierRuleSet`, not by adding supplier-specific `if/else` logic to `pricing-engine.ts`.

## Supplier contract

A supplier definition provides:

- dimension minimums and maximums
- rounding increment
- fabric multipliers
- control/motor surcharges and compatibility restrictions
- option prices and incompatibilities
- width/height pricing grid
- base freight and conditional freight rules
- default target margin
- rule version, grid version, and effective date

Example:

```ts
const delta: SupplierRuleSet = {
  id: "delta",
  name: "Supplier Delta",
  ruleVersion: "delta-rules-v1",
  gridVersion: "delta-2026-09",
  effectiveFrom: "2026-09-01",
  dimensions: {
    minWidth: 18,
    maxWidth: 114,
    minHeight: 24,
    maxHeight: 138,
    roundingIncrement: 0.5,
  },
  // fabrics, controls, options, grid, freight, and margin policy...
};
```

## Why this matters

A CPQ system becomes expensive to maintain when supplier rules leak into UI components, API handlers, and quote calculations. This model centralizes supplier variability and leaves the execution pipeline stable:

```text
validate → compatibility → round → grid → surcharge → freight → cost → margin → explain
```

## Production evolution

In production, the same contract can be populated from PostgreSQL rather than TypeScript fixtures. That enables:

1. effective-dated rule versions
2. supplier price-grid imports from CSV/Excel
3. administrative catalog management
4. quote snapshots that retain historical rule/grid versions
5. approval workflows for rule changes
6. deterministic regression tests before a new supplier version is activated

The core engine remains the policy executor; the supplier catalog becomes data-driven.
