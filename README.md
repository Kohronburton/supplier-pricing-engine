# Supplier Pricing Engine

A configurable **CPQ (Configure–Price–Quote) reference architecture** for supplier-specific window-covering pricing, product validation, price-grid lookup, surcharges, freight, margins, and explainable quoting.

> **Core principle:** supplier-specific behavior is configuration and data—not scattered application conditionals.

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
        GAMMA["Supplier Gamma<br/>Band pricing<br/>Control-based pricing<br/>Custom surcharge rules"]
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

## Explainable pricing

The engine returns both the price and the reasoning used to calculate it:

```text
Input width:                 73.25 in
Supplier rounding rule:     next whole inch
Normalized width:           74 in

Input height:                80.10 in
Supplier rounding rule:     next whole inch
Normalized height:          81 in

Price grid:                  Alpha 2026-Q3
Grid match:                  W74 × H81
Base cost:                   $524.00
Premium fabric surcharge:   +12%
Motorization:                +$185.00
Freight:                     +$55.00
------------------------------------------------
True landed cost:            $826.88
Target margin:               38%
Final sell price:            $1,333.68
```

This trace is intended to make support, audit, supplier disputes, and regression testing significantly easier.

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
| Beta | Next 1/2 inch | Width/height grid | Fabric/motor compatibility, fixed motor surcharge |
| Gamma | Band-based | Width/height bands | Control-based pricing, custom surcharge policies |

## Planned production evolution

```mermaid
flowchart LR
    DEMO["Typed Demo Rules"] --> ADMIN["Supplier Admin / Catalog Builder"]
    ADMIN --> DB["PostgreSQL Rule + Grid Store"]
    DB --> VERSION["Effective-Dated Versioning"]
    VERSION --> IMPORT["CSV / Excel Supplier Imports"]
    IMPORT --> AUDIT["Quote Audit Snapshots"]
    AUDIT --> PAYMENT["Payments + Order Workflow"]
```

## Technology direction

- Next.js + React + TypeScript
- Zod for boundary validation
- Tailwind CSS for the demo UI
- Vitest for pricing regression tests
- PostgreSQL for production supplier/rule/catalog persistence
- Stripe for production payment flow

## Status

The repository is being built as an executable architecture demonstration. The first milestone is a working supplier-agnostic pricing pipeline with Alpha/Beta/Gamma rule sets, explainable calculations, invalid-configuration handling, and automated tests.
