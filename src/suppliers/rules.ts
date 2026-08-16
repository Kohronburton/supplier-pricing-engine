import type { SupplierId, SupplierRuleSet } from "@/src/domain/models";

const alpha: SupplierRuleSet = {
  id: "alpha",
  name: "Supplier Alpha",
  ruleVersion: "alpha-rules-v1",
  gridVersion: "alpha-2026-q3",
  effectiveFrom: "2026-07-01",
  dimensions: {
    minWidth: 18,
    maxWidth: 120,
    minHeight: 24,
    maxHeight: 144,
    roundingIncrement: 1,
  },
  fabrics: [
    { id: "standard", label: "Standard", multiplier: 1 },
    { id: "premium", label: "Premium", multiplier: 1.12 },
    { id: "blackout", label: "Blackout", multiplier: 1.18 },
  ],
  controls: [
    { id: "manual", label: "Manual", fixedSurcharge: 0 },
    { id: "motorized", label: "Motorized", fixedSurcharge: 185, minWidth: 30 },
    { id: "smart", label: "Smart Motor", fixedSurcharge: 265, minWidth: 32 },
  ],
  options: [
    { id: "cassette", label: "Cassette", fixedSurcharge: 0 },
    { id: "valance", label: "Valance", fixedSurcharge: 42 },
    { id: "side-channel", label: "Side Channel", fixedSurcharge: 95, incompatibleControls: ["manual"] },
  ],
  priceGrid: [
    { maxWidth: 36, maxHeight: 60, baseCost: 240 },
    { maxWidth: 48, maxHeight: 72, baseCost: 318 },
    { maxWidth: 60, maxHeight: 84, baseCost: 412 },
    { maxWidth: 74, maxHeight: 81, baseCost: 524 },
    { maxWidth: 84, maxHeight: 96, baseCost: 610 },
    { maxWidth: 96, maxHeight: 108, baseCost: 735 },
    { maxWidth: 120, maxHeight: 144, baseCost: 980 },
  ],
  baseFreight: 55,
  freightRules: [
    { id: "ALPHA-OVERSIZE-01", label: "Oversize width handling", minWidth: 96.01, amount: 65 },
    { id: "ALPHA-TALL-01", label: "Tall shade handling", minHeight: 120.01, amount: 45 },
  ],
  defaultTargetMargin: 0.38,
};

const beta: SupplierRuleSet = {
  id: "beta",
  name: "Supplier Beta",
  ruleVersion: "beta-rules-v1",
  gridVersion: "beta-2026-08",
  effectiveFrom: "2026-08-01",
  dimensions: {
    minWidth: 16,
    maxWidth: 108,
    minHeight: 20,
    maxHeight: 132,
    roundingIncrement: 0.5,
  },
  fabrics: [
    { id: "standard", label: "Standard", multiplier: 1 },
    { id: "premium", label: "Premium", multiplier: 1.09 },
    { id: "blackout", label: "Blackout", multiplier: 1.15 },
  ],
  controls: [
    { id: "manual", label: "Manual", fixedSurcharge: 0 },
    { id: "motorized", label: "Motorized", fixedSurcharge: 210, minWidth: 28, incompatibleFabrics: ["blackout"] },
    { id: "smart", label: "Smart Motor", fixedSurcharge: 285, minWidth: 30 },
  ],
  options: [
    { id: "cassette", label: "Cassette", fixedSurcharge: 38 },
    { id: "valance", label: "Valance", fixedSurcharge: 34 },
    { id: "side-channel", label: "Side Channel", fixedSurcharge: 110 },
  ],
  priceGrid: [
    { maxWidth: 36, maxHeight: 60, baseCost: 228 },
    { maxWidth: 48, maxHeight: 72, baseCost: 302 },
    { maxWidth: 60, maxHeight: 84, baseCost: 398 },
    { maxWidth: 72, maxHeight: 96, baseCost: 505 },
    { maxWidth: 84, maxHeight: 108, baseCost: 622 },
    { maxWidth: 96, maxHeight: 120, baseCost: 748 },
    { maxWidth: 108, maxHeight: 132, baseCost: 890 },
  ],
  baseFreight: 48,
  freightRules: [
    { id: "BETA-OVERSIZE-01", label: "Oversize width handling", minWidth: 90.01, amount: 72 },
  ],
  defaultTargetMargin: 0.4,
};

const gamma: SupplierRuleSet = {
  id: "gamma",
  name: "Supplier Gamma",
  ruleVersion: "gamma-rules-v1",
  gridVersion: "gamma-2026-h2",
  effectiveFrom: "2026-07-15",
  dimensions: {
    minWidth: 20,
    maxWidth: 126,
    minHeight: 20,
    maxHeight: 150,
    roundingIncrement: 2,
  },
  fabrics: [
    { id: "standard", label: "Standard", multiplier: 1 },
    { id: "premium", label: "Premium", multiplier: 1.14 },
    { id: "blackout", label: "Blackout", multiplier: 1.2 },
  ],
  controls: [
    { id: "manual", label: "Manual", fixedSurcharge: 0 },
    { id: "motorized", label: "Motorized", fixedSurcharge: 195, minWidth: 26 },
    { id: "smart", label: "Smart Motor", fixedSurcharge: 310, minWidth: 30, incompatibleFabrics: ["blackout"] },
  ],
  options: [
    { id: "cassette", label: "Cassette", fixedSurcharge: 55 },
    { id: "valance", label: "Valance", fixedSurcharge: 28 },
    { id: "side-channel", label: "Side Channel", fixedSurcharge: 125 },
  ],
  priceGrid: [
    { maxWidth: 40, maxHeight: 60, baseCost: 260 },
    { maxWidth: 56, maxHeight: 80, baseCost: 355 },
    { maxWidth: 72, maxHeight: 100, baseCost: 470 },
    { maxWidth: 88, maxHeight: 120, baseCost: 615 },
    { maxWidth: 104, maxHeight: 132, baseCost: 790 },
    { maxWidth: 126, maxHeight: 150, baseCost: 1050 },
  ],
  baseFreight: 62,
  freightRules: [
    { id: "GAMMA-LARGE-01", label: "Large-format handling", minWidth: 88.01, amount: 85 },
    { id: "GAMMA-TALL-01", label: "Tall-format handling", minHeight: 132.01, amount: 60 },
  ],
  defaultTargetMargin: 0.36,
};

export const supplierRuleSets: Record<SupplierId, SupplierRuleSet> = {
  alpha,
  beta,
  gamma,
};

export function getSupplierRuleSet(id: SupplierId): SupplierRuleSet {
  return supplierRuleSets[id];
}
