# Architecture Decisions

This document explains the decisions behind the Supplier Pricing Engine reference implementation. The goal is not to prescribe one universal CPQ stack; it is to show how I would reason about a supplier-heavy quoting system before scaling it.

## 1. Keep the authoritative price path deterministic

**Decision:** Pricing, compatibility, rounding, freight, and margin calculations are implemented as deterministic application logic and versioned rule data.

**Why:** A quote must be reproducible. If the same inputs and rule versions are used, the same price should be produced every time. That makes pricing testable, auditable, and easier to support.

**Where AI can help:** AI is useful for supplier-catalog ingestion, extracting proposed rules from PDFs or spreadsheets, mapping fields, administrative assistance, and exception triage. Those outputs should be reviewed before they become authoritative pricing data.

**What I avoided:** An LLM deciding the final price or whether a product combination is valid.

---

## 2. Make supplier behavior data-driven

**Decision:** Supplier-specific behavior lives in rule sets and product-program configuration rather than being spread across UI components or a giant supplier switch statement.

**Why:** Supplier pricing changes more often than the core application architecture. Keeping supplier behavior isolated makes onboarding a new supplier or revising a price book lower risk.

**Result in the demo:** Alpha, Beta, and Gamma use the same engine while applying different:

- dimension ranges
- rounding increments
- product programs
- fabric multipliers
- control restrictions
- option compatibility
- price grids
- freight rules
- margin defaults

---

## 3. Version rules and price tables

**Decision:** Successful quotes retain both a supplier rule version and a price-table version.

**Why:** A price book can change tomorrow without invalidating the explanation of a quote created today. Persisting provenance is essential for support, re-quotes, disputes, approvals, and audits.

**Production extension:** Store effective dates, retired versions, immutable quote snapshots, and the resolved rule identifiers applied to each quote line.

---

## 4. Validate before pricing

**Decision:** The engine checks dimensions and compatibility before resolving a price.

**Why:** A numerically valid price for an impossible product is still a bad quote. Blocking invalid combinations early prevents downstream order errors and reduces exception handling.

**Examples in the demo:**

- minimum motor width
- supplier-specific fabric/motor conflicts
- option/control incompatibility
- supplier dimension limits

---

## 5. Use a modular monolith first

**Decision:** The reference implementation is organized as a modular application rather than a distributed microservice system.

**Why:** The early risk is rule correctness and supplier onboarding, not service-to-service throughput. A modular monolith is easier to ship, test, observe, and debug while the domain is still evolving.

**When I would split services:**

- independent team ownership emerges
- supplier ingestion becomes operationally heavy
- quote calculation needs separate scaling characteristics
- asynchronous order/payment workflows justify their own bounded contexts
- isolation or compliance requirements demand stronger boundaries

---

## 6. Separate internal economics from customer-facing output

**Decision:** The sales/deal-desk view can see true cost, target margin, realized margin, approval state, and calculation trace. The customer-facing quote intentionally hides internal cost and margin data.

**Why:** A CPQ system serves multiple audiences. Sales needs commercial controls; customers need a clean offer. Mixing those views creates security and usability problems.

---

## 7. Add quote-level commercial controls after item pricing

**Decision:** The demo calculates item prices first, then aggregates line items into quote-level subtotal, discount, realized margin, deposit, and balance due.

**Why:** Commercial exceptions usually happen at the deal level. A quote may contain several rooms, quantities, products, and suppliers while still needing one discount and one approval decision.

**Margin guard:** The V5 demo uses a 30% minimum realized-margin floor to demonstrate an approval workflow. The threshold is illustrative and would be configurable in production.

---

## 8. Test behavior, not implementation details

The automated Vitest suite covers pricing outcomes and commercial behavior, including:

- the documented Alpha reference quote
- supplier dimension/rounding differences
- compatibility failures
- product-program pricing
- rule/grid provenance
- multi-line quote aggregation
- discounts and deposits
- margin-floor approval behavior

GitHub Actions runs the regression suite and a production Next.js build before changes are merged.

---

## Production path

For a production implementation I would evolve the demo in phases rather than rewriting it:

1. PostgreSQL-backed supplier catalogs, rule versions, price grids, customers, quotes, and audit snapshots.
2. Admin workflows for supplier onboarding, CSV/XLSX imports, validation, preview, and publishing.
3. Role-based access for sales, pricing administrators, approvers, and operations.
4. Durable quote lifecycle: draft, approval, sent, accepted, expired, revised, ordered.
5. Payment integration, order handoff, webhook processing, idempotency, and reconciliation.
6. Observability around pricing failures, rule misses, invalid configurations, and supplier-data quality.
7. Optional AI-assisted catalog ingestion with human review before publication.

The core principle remains the same: **supplier-specific behavior changes frequently; the pricing engine should not have to.**
