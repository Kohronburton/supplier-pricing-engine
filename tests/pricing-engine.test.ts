import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/src/engine/pricing-engine";

const baseConfig = {
  product: "roller-shade" as const,
  fabric: "premium" as const,
  controlType: "motorized" as const,
  options: ["cassette" as const],
};

describe("supplier pricing engine", () => {
  it("calculates the documented Alpha reference quote", () => {
    const result = calculateQuote({
      ...baseConfig,
      supplier: "alpha",
      width: 73.25,
      height: 80.1,
      targetMargin: 0.38,
    });

    expect(result.valid).toBe(true);
    if (!result.valid) return;

    expect(result.normalizedDimensions).toEqual({ width: 74, height: 81 });
    expect(result.gridVersion).toBe("alpha-2026-q3");
    expect(result.pricing).toMatchObject({
      baseCost: 524,
      fabricSurcharge: 62.88,
      controlSurcharge: 185,
      optionSurcharge: 0,
      freight: 55,
      trueCost: 826.88,
      targetMargin: 0.38,
      sellPrice: 1333.68,
    });
    expect(result.trace.some((step) => step.stage === "grid")).toBe(true);
    expect(result.trace.some((step) => step.stage === "margin")).toBe(true);
  });

  it("blocks Alpha motorization below the supplier minimum width", () => {
    const result = calculateQuote({
      ...baseConfig,
      supplier: "alpha",
      width: 24,
      height: 60,
    });

    expect(result.valid).toBe(false);
    if (result.valid) return;

    expect(result.errors.join(" ")).toContain("minimum width of 30");
  });

  it("enforces Beta fabric/motor compatibility rules", () => {
    const result = calculateQuote({
      supplier: "beta",
      product: "roller-shade",
      width: 48,
      height: 70,
      fabric: "blackout",
      controlType: "motorized",
      options: [],
    });

    expect(result.valid).toBe(false);
    if (result.valid) return;

    expect(result.errors.join(" ")).toContain("not compatible");
  });

  it("applies Gamma's two-inch rounding policy", () => {
    const result = calculateQuote({
      supplier: "gamma",
      product: "roller-shade",
      width: 71.1,
      height: 98.1,
      fabric: "standard",
      controlType: "manual",
      options: [],
    });

    expect(result.valid).toBe(true);
    if (!result.valid) return;

    expect(result.normalizedDimensions).toEqual({ width: 72, height: 100 });
    expect(result.gridVersion).toBe("gamma-2026-h2");
  });

  it("keeps supplier rule and grid versions on every successful quote", () => {
    const result = calculateQuote({
      supplier: "beta",
      product: "roller-shade",
      width: 60,
      height: 84,
      fabric: "standard",
      controlType: "manual",
      options: [],
    });

    expect(result.valid).toBe(true);
    if (!result.valid) return;

    expect(result.ruleVersion).toBe("beta-rules-v1");
    expect(result.gridVersion).toBe("beta-2026-08");
  });
});
