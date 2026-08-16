import type {
  CalculationTraceStep,
  PriceGridCell,
  ProductConfiguration,
  QuoteResult,
  SupplierRuleSet,
} from "@/src/domain/models";
import { getSupplierRuleSet } from "@/src/suppliers/rules";

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundUpToIncrement(value: number, increment: number): number {
  return Math.ceil(value / increment) * increment;
}

function resolveGridCell(
  grid: PriceGridCell[],
  width: number,
  height: number,
): PriceGridCell | undefined {
  return grid
    .filter((cell) => cell.maxWidth >= width && cell.maxHeight >= height)
    .sort((a, b) => {
      const areaDelta = a.maxWidth * a.maxHeight - b.maxWidth * b.maxHeight;
      if (areaDelta !== 0) return areaDelta;
      return a.maxWidth - b.maxWidth || a.maxHeight - b.maxHeight;
    })[0];
}

function validateDimensions(
  config: ProductConfiguration,
  supplier: SupplierRuleSet,
  trace: CalculationTraceStep[],
): string[] {
  const errors: string[] = [];
  const { dimensions } = supplier;

  if (config.width < dimensions.minWidth || config.width > dimensions.maxWidth) {
    errors.push(
      `Width ${config.width}\" is outside ${supplier.name}'s supported range of ${dimensions.minWidth}\"–${dimensions.maxWidth}\".`,
    );
  }

  if (config.height < dimensions.minHeight || config.height > dimensions.maxHeight) {
    errors.push(
      `Height ${config.height}\" is outside ${supplier.name}'s supported range of ${dimensions.minHeight}\"–${dimensions.maxHeight}\".`,
    );
  }

  trace.push({
    stage: "validation",
    message:
      errors.length === 0
        ? `Dimensions are within ${supplier.name}'s supported range.`
        : `Dimension validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}.`,
  });

  return errors;
}

function validateCompatibility(
  config: ProductConfiguration,
  supplier: SupplierRuleSet,
  trace: CalculationTraceStep[],
): string[] {
  const errors: string[] = [];
  const product = supplier.products.find((item) => item.id === config.product);
  const fabric = supplier.fabrics.find((item) => item.id === config.fabric);
  const control = supplier.controls.find((item) => item.id === config.controlType);

  if (!product) {
    errors.push(`Product '${config.product}' is not available from ${supplier.name}.`);
  }

  if (!fabric) {
    errors.push(`Fabric '${config.fabric}' is not available from ${supplier.name}.`);
  }

  if (!control) {
    errors.push(`Control '${config.controlType}' is not available from ${supplier.name}.`);
  }

  if (control?.minWidth && config.width < control.minWidth) {
    errors.push(
      `${control.label} requires a minimum width of ${control.minWidth}\" for ${supplier.name}.`,
    );
  }

  if (control?.incompatibleFabrics?.includes(config.fabric)) {
    errors.push(
      `${control.label} is not compatible with ${fabric?.label ?? config.fabric} fabric for ${supplier.name}.`,
    );
  }

  for (const optionId of config.options) {
    const option = supplier.options.find((item) => item.id === optionId);
    if (!option) {
      errors.push(`Option '${optionId}' is not available from ${supplier.name}.`);
      continue;
    }

    if (option.incompatibleControls?.includes(config.controlType)) {
      errors.push(
        `${option.label} is not compatible with ${control?.label ?? config.controlType} for ${supplier.name}.`,
      );
    }
  }

  trace.push({
    stage: "compatibility",
    message:
      errors.length === 0
        ? `Product, fabric, control, and option compatibility checks passed.`
        : `Compatibility validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}.`,
  });

  return errors;
}

export function calculateQuote(config: ProductConfiguration): QuoteResult {
  const supplier = getSupplierRuleSet(config.supplier);
  const trace: CalculationTraceStep[] = [];

  const errors = [
    ...validateDimensions(config, supplier, trace),
    ...validateCompatibility(config, supplier, trace),
  ];

  if (errors.length > 0) {
    return {
      valid: false,
      supplier: config.supplier,
      errors,
      trace,
    };
  }

  const normalizedWidth = roundUpToIncrement(
    config.width,
    supplier.dimensions.roundingIncrement,
  );
  const normalizedHeight = roundUpToIncrement(
    config.height,
    supplier.dimensions.roundingIncrement,
  );

  trace.push({
    stage: "rounding",
    message: `Width ${config.width}\" → ${normalizedWidth}\" and height ${config.height}\" → ${normalizedHeight}\" using ${supplier.dimensions.roundingIncrement}\" increments.`,
  });

  const gridCell = resolveGridCell(
    supplier.priceGrid,
    normalizedWidth,
    normalizedHeight,
  );

  if (!gridCell) {
    return {
      valid: false,
      supplier: config.supplier,
      errors: [
        `No ${supplier.name} price-grid cell covers ${normalizedWidth}\" × ${normalizedHeight}\".`,
      ],
      trace: [
        ...trace,
        {
          stage: "grid",
          message: `Price-grid lookup failed for ${supplier.gridVersion}.`,
        },
      ],
    };
  }

  const product = supplier.products.find((item) => item.id === config.product)!;
  const gridBaseCost = roundCurrency(gridCell.baseCost);
  const productAdjustment = roundCurrency(
    gridBaseCost * Math.max(0, product.multiplier - 1),
  );
  const baseCost = roundCurrency(gridBaseCost + productAdjustment);

  trace.push({
    stage: "grid",
    message: `${supplier.gridVersion} matched ${gridCell.maxWidth}\" × ${gridCell.maxHeight}\" at $${gridBaseCost.toFixed(2)}. ${product.label} applies ${product.multiplier === 1 ? "no product adjustment" : `a ${((product.multiplier - 1) * 100).toFixed(0)}% product adjustment`}.`,
  });

  const fabric = supplier.fabrics.find((item) => item.id === config.fabric)!;
  const control = supplier.controls.find((item) => item.id === config.controlType)!;
  const selectedOptions = config.options.map(
    (optionId) => supplier.options.find((item) => item.id === optionId)!,
  );

  const fabricSurcharge = roundCurrency(
    baseCost * Math.max(0, fabric.multiplier - 1),
  );
  const controlSurcharge = roundCurrency(control.fixedSurcharge);
  const optionSurcharge = roundCurrency(
    selectedOptions.reduce((sum, option) => sum + option.fixedSurcharge, 0),
  );

  trace.push({
    stage: "surcharge",
    message: `${fabric.label} fabric adds $${fabricSurcharge.toFixed(2)}; ${control.label} adds $${controlSurcharge.toFixed(2)}; selected options add $${optionSurcharge.toFixed(2)}.`,
  });

  const matchedFreightRules = supplier.freightRules.filter((rule) => {
    const widthMatches = rule.minWidth === undefined || normalizedWidth >= rule.minWidth;
    const heightMatches = rule.minHeight === undefined || normalizedHeight >= rule.minHeight;
    return widthMatches && heightMatches;
  });

  const freight = roundCurrency(
    supplier.baseFreight +
      matchedFreightRules.reduce((sum, rule) => sum + rule.amount, 0),
  );

  trace.push({
    stage: "freight",
    message:
      matchedFreightRules.length === 0
        ? `Base freight of $${supplier.baseFreight.toFixed(2)} applied.`
        : `Base freight plus ${matchedFreightRules.map((rule) => rule.id).join(", ")} applied for $${freight.toFixed(2)} total freight.`,
  });

  const trueCost = roundCurrency(
    baseCost +
      fabricSurcharge +
      controlSurcharge +
      optionSurcharge +
      freight,
  );

  const targetMargin = config.targetMargin ?? supplier.defaultTargetMargin;
  if (targetMargin <= 0 || targetMargin >= 1) {
    return {
      valid: false,
      supplier: config.supplier,
      errors: ["Target margin must be greater than 0 and less than 1."],
      trace,
    };
  }

  const sellPrice = roundCurrency(trueCost / (1 - targetMargin));

  trace.push({
    stage: "margin",
    message: `True landed cost $${trueCost.toFixed(2)} priced at ${(targetMargin * 100).toFixed(1)}% target margin → $${sellPrice.toFixed(2)} sell price.`,
  });

  return {
    valid: true,
    supplier: config.supplier,
    ruleVersion: supplier.ruleVersion,
    gridVersion: supplier.gridVersion,
    normalizedDimensions: {
      width: normalizedWidth,
      height: normalizedHeight,
    },
    pricing: {
      gridBaseCost,
      productAdjustment,
      baseCost,
      fabricSurcharge,
      controlSurcharge,
      optionSurcharge,
      freight,
      trueCost,
      targetMargin,
      sellPrice,
    },
    trace,
  };
}
