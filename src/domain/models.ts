export type SupplierId = "alpha" | "beta" | "gamma";
export type FabricId = "standard" | "premium" | "blackout";
export type ControlId = "manual" | "motorized" | "smart";
export type OptionId = "cassette" | "valance" | "side-channel";

export interface ProductConfiguration {
  supplier: SupplierId;
  product: "roller-shade";
  width: number;
  height: number;
  fabric: FabricId;
  controlType: ControlId;
  options: OptionId[];
  targetMargin?: number;
}

export interface DimensionRules {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  roundingIncrement: number;
}

export interface PriceGridCell {
  maxWidth: number;
  maxHeight: number;
  baseCost: number;
}

export interface FabricRule {
  id: FabricId;
  label: string;
  multiplier: number;
}

export interface ControlRule {
  id: ControlId;
  label: string;
  fixedSurcharge: number;
  minWidth?: number;
  incompatibleFabrics?: FabricId[];
}

export interface OptionRule {
  id: OptionId;
  label: string;
  fixedSurcharge: number;
  incompatibleControls?: ControlId[];
}

export interface FreightRule {
  id: string;
  label: string;
  minWidth?: number;
  minHeight?: number;
  amount: number;
}

export interface SupplierRuleSet {
  id: SupplierId;
  name: string;
  ruleVersion: string;
  gridVersion: string;
  effectiveFrom: string;
  dimensions: DimensionRules;
  fabrics: FabricRule[];
  controls: ControlRule[];
  options: OptionRule[];
  priceGrid: PriceGridCell[];
  baseFreight: number;
  freightRules: FreightRule[];
  defaultTargetMargin: number;
}

export interface CalculationTraceStep {
  stage:
    | "validation"
    | "compatibility"
    | "rounding"
    | "grid"
    | "surcharge"
    | "freight"
    | "margin";
  message: string;
}

export interface PricingBreakdown {
  baseCost: number;
  fabricSurcharge: number;
  controlSurcharge: number;
  optionSurcharge: number;
  freight: number;
  trueCost: number;
  targetMargin: number;
  sellPrice: number;
}

export interface ValidQuoteResult {
  valid: true;
  supplier: SupplierId;
  ruleVersion: string;
  gridVersion: string;
  normalizedDimensions: {
    width: number;
    height: number;
  };
  pricing: PricingBreakdown;
  trace: CalculationTraceStep[];
}

export interface InvalidQuoteResult {
  valid: false;
  supplier?: SupplierId;
  errors: string[];
  trace: CalculationTraceStep[];
}

export type QuoteResult = ValidQuoteResult | InvalidQuoteResult;
