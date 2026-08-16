# Supplier Pricing Engine

![CPQ Engine CI](https://github.com/Kohronburton/supplier-pricing-engine/actions/workflows/ci.yml/badge.svg)

A configurable **CPQ (Configure–Price–Quote) reference implementation** for supplier-specific window-covering pricing, product validation, price-grid lookup, surcharges, freight, margins, and explainable quoting.

> **Core principle:** supplier-specific behavior is configuration and data—not scattered application conditionals.

## What is implemented

The repository now includes an executable Next.js/TypeScript demo with:

- three suppliers with intentionally different pricing behavior
- min/max dimension validation
- supplier-specific dimension rounding
- fabric, control, motor, and option compatibility rules
- width/height price-grid resolution
- fixed and percentage surcharges
- standard and conditional freight rules
- true landed-cost calculation
- target-margin / sell-price calculation
- rule-set and price-grid version metadata
- explainable calculation traces
- Zod API boundary validation
- automated Vitest regression tests
- GitHub Actions build/test validation

The interactive workbench recalculates as configuration changes and blocks invalid combinations before a price is produced.

## Quick start

```bash
git clone https://github.com/Kohronburton/supplier-pricing-engine.git
cd supplier-pricing-engine
npm install
npm run dev
```

Open `http://localhost:3000`.

Run the pricing regression suite:

```bash
npm test
```

Build the production application:

```bash
npm run build
```

## Why this exists

Custom-product quoting becomes difficult when every supplier uses a different pricing model. One supplier may round dimensions to the next whole inch, another to the next half inch, while others use width/height bands, product-specific compatibility rules, motor restrictions, surcharges, and freight thresholds.

This repository demonstrates how to put those differences behind one deterministic, testable pricing pipeline.

## Architecture

```mermaid
flowchart TB
    subgraph UI["CPQ Web Application"]
        direction LR
        CONFIG["Product Configurator<br/>Supplier · Product · Width · Height<br/>Fabric · Control · Motor · Options"]
        QUOTE["Quote Analysis<br/>Normalized Dimensions<br/>True Cost · Margin · Sell Price"]
        TRACE["Calculation Trace<br/>Rules Applied · Grid Match<br/>Surcharges · Freight · Errors"]
    end

    subgraph APP["Application Layer"]
        direction LR
        API["Quote API<br/>POST /api/quote"]
        SCHEMA["Request Validation<br/>Zod + TypeScript"]
        SERVICE["Quote Service<br/>Orchestration"]
    end

    subgraph CORE["Core CPQ Rule Engine"]
        direction TB
        NORMALIZE["1. Normalize Configuration"]
        VALIDATE["2. Validate Min/Max Dimensions"]
        COMPAT["3. Evaluate Compatibility Rules"]
        ROUND["4. Apply Supplier Rounding"]
        GRID["5. Resolve Price Grid Cell"]
        SUR["6. Apply Surcharges"]
        FREIGHT["7. Apply Freight Rules"]
        COST["8. Calculate True Landed Cost"]
        MARGIN["9. Apply Commercial Pricing Policy"]
        EXPLAIN["10. Produce Calculation Trace"]
        RESULT["Quote Result<br/>Valid/Invalid · Cost · Margin · Sell Price"]
    end

    subgraph SUPPLIERS["Supplier Rule Registry"]
        direction LR
        ALPHA["Supplier Alpha<br/>Whole-inch rounding<br/>Motor min width<br/>Premium fabric %"]
        BETA["Supplier Beta<br/>Half-inch rounding<br/>Fabric/motor restrictions<br/>Fixed motor surcharge"]
        GAMMA["Supplier Gamma<br/>2-inch rounding<br/>Band pricing<br/>Custom surcharge rules"]
        DELTA["Supplier Delta<br/>Add config + pricing data<br/>No core-engine rewrite"]
    end

    subgraph RULES["Versioned Rule Definitions"]
        direction LR
        DIM["Dimension Rules<br/>Min · Max · Increment"]
        COMPR["Compatibility Rules<br/>Fabric · Motor · Control · Options"]
        PRICE["Pricing Rules<br/>Grid Version · Effective Dates"]
        SURR["Surcharge Rules<br/>Fixed · % · Conditional"]
        FR["Freight Rules<br/>Standard · Oversize · Zone"]
        MR["Commercial Rules<br/>Margin · Markup · Discount Limits"]
    end

    subgraph DATA["Catalog & Pricing Data"]
        direction LR
        PRODUCTS["Products & Families"]
        FABRICS["Fabrics & Price Groups"]
        CONTROLS["Controls & Motors"]
        OPTIONS["Options"]
        PRICEGRID["Supplier Price Grids<br/>Width Bands × Height Bands"]
        VERSION["Version Metadata<br/>Rule Version · Grid Version<br/>Effective From/To"]
    end

    subgraph STORAGE["Production Persistence"]
        direction LR
        DB["PostgreSQL<br/>Suppliers · Rules · Price Grids<br/>Quotes · Customers"]
        AUDIT["Quote Audit Snapshot<br/>Inputs · Rule Version<br/>Grid Version · Result"]
        IMPORTS["Supplier Imports<br/>CSV · Excel · PDF"]
    end

    subgraph ORDERFLOW["Quote-to-Order"]
        direction LR
        SAVED["Saved Quote"]
        APPROVAL["Customer Approval"]
        PAYMENT["Payment"]
        ORDER["Order Creation"]
    end

    CONFIG --> API --> SCHEMA --> SERVICE --> NORMALIZE --> VALIDATE
    VALIDATE -->|valid| COMPAT
    VALIDATE -->|invalid| RESULT
    COMPAT -->|compatible| ROUND
    COMPAT -->|invalid combination| RESULT
    ROUND --> GRID --> SUR --> FREIGHT --> COST --> MARGIN --> EXPLAIN --> RESULT
    RESULT --> QUOTE
    RESULT --> TRACE

    SUPPLIERS --> RULES
    ALPHA --> DIM
    ALPHA --> COMPR
    ALPHA --> PRICE
    BETA --> DIM
    BETA --> COMPR
    BETA --> PRICE
    GAMMA --> DIM
    GAMMA --> COMPR
    GAMMA --> PRICE
    DELTA --> RULES

    DIM --> VALIDATE
    DIM --> ROUND
    COMPR --> COMPAT
    PRICE --> GRID
    SURR --> SUR
    FR --> FREIGHT
    MR --> MARGIN

    PRODUCTS --> NORMALIZE
    FABRICS --> COMPAT
    CONTROLS --> COMPAT
    OPTIONS --> COMPAT
    PRICEGRID --> GRID
    VERSION --> PRICE

    IMPORTS --> DB
    DB --> DATA
    DB --> RULES
    RESULT --> AUDIT --> DB

    RESULT --> SAVED --> APPROVAL --> PAYMENT --> ORDER
```

## Pricing execution model

```text
Raw configuration
      ↓
Schema validation
      ↓
Supplier rule resolution
      ↓
Dimension validation
      ↓
Compatibility validation
      ↓
Supplier-specific rounding
      ↓
Price-grid lookup
      ↓
Surcharges + options
      ↓
Freight
      ↓
True landed cost
      ↓
Margin / sell-price policy
      ↓
Explainable quote result
```

## Reference quote

The default Alpha scenario intentionally exercises multiple stages of the engine:

```text
Input width:                 73.25 in
Supplier rounding rule:     next whole inch
Normalized width:           74 in

Input height:                80.10 in
Supplier rounding rule:     next whole inch
Normalized height:          81 in

Price grid:                  alpha-2026-q3
Grid match:                  W74 × H81
Base cost:                   $524.00
Premium fabric surcharge:   +$62.88
Motorization:                +$185.00
Freight:                     +$55.00
------------------------------------------------
True landed cost:            $826.88
Target margin:               38%
Final sell price:            $1,333.68
```

The output also records the exact `ruleVersion` and `gridVersion` used, so a historical quote can be reproduced after supplier pricing changes.

## Invalid configuration example

A 24-inch-wide Alpha shade with a motorized control is blocked before pricing because Alpha motorization requires a minimum 30-inch width.

```text
Configuration blocked
└── Motorized requires a minimum width of 30" for Supplier Alpha.
```

This is deliberate: invalid product combinations should fail before price calculation, not become downstream order problems.

## Supplier extension model

`src/suppliers/rules.ts` contains typed supplier definitions. `src/engine/pricing-engine.ts` contains the supplier-agnostic execution pipeline.

Adding a supplier should primarily require a new rule/data definition rather than edits to the engine. See [Adding a Supplier Without Rewriting the Engine](docs/adding-a-supplier.md).

## Design goals

- **Deterministic:** authoritative pricing does not depend on an LLM.
- **Supplier-agnostic core:** adding a supplier should not require editing the pricing pipeline.
- **Versionable:** historical quotes retain the rule/grid versions used at quote time.
- **Explainable:** every normalization, surcharge, freight rule, and price-grid match can be traced.
- **Testable:** supplier edge cases are encoded as automated regression tests.
- **Production-oriented:** the demo uses typed in-memory fixtures while preserving a clean path to PostgreSQL-backed rules and price grids.

## Demo suppliers

| Supplier | Rounding | Pricing | Key Rules |
|---|---|---|---|
| Alpha | Next whole inch | Width/height grid | Motor minimum width, premium-fabric percentage, oversize freight |
| Beta | Next 1/2 inch | Width/height grid | Fabric/motor incompatibility, fixed motor surcharge |
| Gamma | Next 2 inches | Width/height grid | Different size bands, smart-motor restrictions, large-format freight |

## Repository structure

```text
app/
├── api/quote/route.ts       # validated quote endpoint
├── globals.css              # polished demo workbench UI
├── layout.tsx
└── page.tsx                 # interactive configurator + quote trace

src/
├── domain/models.ts         # CPQ domain contracts
├── engine/pricing-engine.ts # supplier-agnostic rule executor
├── suppliers/rules.ts       # Alpha/Beta/Gamma rule sets + price grids
└── validation/quote-schema.ts

tests/
└── pricing-engine.test.ts   # pricing + compatibility regression tests
```

## Production evolution

```mermaid
flowchart LR
    DEMO["Typed Demo Rules"] --> ADMIN["Supplier Admin / Catalog Builder"]
    ADMIN --> DB["PostgreSQL Rule + Grid Store"]
    DB --> VERSION["Effective-Dated Versioning"]
    VERSION --> IMPORT["CSV / Excel Supplier Imports"]
    IMPORT --> AUDIT["Quote Audit Snapshots"]
    AUDIT --> PAYMENT["Payments + Order Workflow"]
```

A production implementation would move supplier definitions and price grids from TypeScript fixtures into a versioned PostgreSQL model, add catalog-import workflows, preserve immutable quote calculation snapshots, and layer customer approval/payment/order workflows above the deterministic pricing core.

## Technology

- Next.js
- React
- TypeScript
- Zod
- Vitest
- GitHub Actions
- PostgreSQL planned for production persistence
- Stripe planned for payment workflow
