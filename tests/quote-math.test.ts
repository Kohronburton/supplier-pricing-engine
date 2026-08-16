import { describe, expect, it } from "vitest";
import { calculateQuoteCommercials } from "@/src/quote/quote-math";

describe("quote commercial math", () => {
  const lines = [
    { quantity: 2, unitSellPrice: 1000, unitTrueCost: 600 },
    { quantity: 1, unitSellPrice: 500, unitTrueCost: 300 },
  ];

  it("aggregates multi-line totals and deposit", () => {
    const result = calculateQuoteCommercials(lines, 0, 50, 0.3);

    expect(result.subtotal).toBe(2500);
    expect(result.trueCost).toBe(1500);
    expect(result.grossProfit).toBe(1000);
    expect(result.realizedMargin).toBe(0.4);
    expect(result.depositAmount).toBe(1250);
    expect(result.balanceDue).toBe(1250);
    expect(result.approvalRequired).toBe(false);
  });

  it("requires approval when discount pushes margin below floor", () => {
    const result = calculateQuoteCommercials(lines, 20, 50, 0.3);

    expect(result.discountAmount).toBe(500);
    expect(result.netPrice).toBe(2000);
    expect(result.grossProfit).toBe(500);
    expect(result.realizedMargin).toBe(0.25);
    expect(result.approvalRequired).toBe(true);
  });

  it("clamps discount and deposit percentages", () => {
    const result = calculateQuoteCommercials(lines, 150, -10, 0.3);

    expect(result.netPrice).toBe(0);
    expect(result.depositAmount).toBe(0);
    expect(result.balanceDue).toBe(0);
  });
});
