export interface QuoteMathLine {
  quantity: number;
  unitSellPrice: number;
  unitTrueCost: number;
}

export interface QuoteCommercials {
  subtotal: number;
  trueCost: number;
  discountAmount: number;
  netPrice: number;
  grossProfit: number;
  realizedMargin: number;
  depositAmount: number;
  balanceDue: number;
  approvalRequired: boolean;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function calculateQuoteCommercials(
  lines: QuoteMathLine[],
  discountPercent: number,
  depositPercent: number,
  minimumMargin: number,
): QuoteCommercials {
  const subtotal = roundCurrency(
    lines.reduce(
      (sum, line) => sum + line.unitSellPrice * Math.max(1, line.quantity),
      0,
    ),
  );
  const trueCost = roundCurrency(
    lines.reduce(
      (sum, line) => sum + line.unitTrueCost * Math.max(1, line.quantity),
      0,
    ),
  );

  const discountRate = clampPercent(discountPercent) / 100;
  const depositRate = clampPercent(depositPercent) / 100;
  const discountAmount = roundCurrency(subtotal * discountRate);
  const netPrice = roundCurrency(Math.max(0, subtotal - discountAmount));
  const grossProfit = roundCurrency(netPrice - trueCost);
  const realizedMargin = netPrice > 0 ? grossProfit / netPrice : 0;
  const depositAmount = roundCurrency(netPrice * depositRate);
  const balanceDue = roundCurrency(netPrice - depositAmount);
  const approvalRequired = lines.length > 0 && realizedMargin < minimumMargin;

  return {
    subtotal,
    trueCost,
    discountAmount,
    netPrice,
    grossProfit,
    realizedMargin,
    depositAmount,
    balanceDue,
    approvalRequired,
  };
}
