import type { CompanySettings } from "./generated/api.schemas";

export const COMPANY_PRICING_DEFAULTS = {
  taxRatePercent: 0,
  discountTier1MinDays: 7,
  discountTier1Percent: 10,
  discountTier2MinDays: 30,
  discountTier2Percent: 30,
  discountTier3MinDays: 60,
  discountTier3Percent: 40,
} as const;

export type CompanyPricingConfig = {
  taxRatePercent: number;
  discountTier1MinDays: number;
  discountTier1Percent: number;
  discountTier2MinDays: number;
  discountTier2Percent: number;
  discountTier3MinDays: number;
  discountTier3Percent: number;
};

export type DiscountTier = {
  minDays: number;
  percent: number;
};

export type AppliedDiscountBlock = {
  minDays: number;
  percent: number;
  blocksCount: number;
  daysCovered: number;
  baseSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizePercent(value: unknown, fallback: number) {
  return normalizeInteger(value, fallback, 0, 100);
}

function buildDiscountTiers(config: CompanyPricingConfig): DiscountTier[] {
  const tierMap = new Map<number, number>();

  for (const tier of [
    {
      minDays: config.discountTier1MinDays,
      percent: config.discountTier1Percent,
    },
    {
      minDays: config.discountTier2MinDays,
      percent: config.discountTier2Percent,
    },
    {
      minDays: config.discountTier3MinDays,
      percent: config.discountTier3Percent,
    },
  ]) {
    if (tier.minDays <= 0 || tier.percent <= 0) continue;

    const existingPercent = tierMap.get(tier.minDays) ?? 0;
    if (tier.percent > existingPercent) {
      tierMap.set(tier.minDays, tier.percent);
    }
  }

  return [...tierMap.entries()]
    .map(([minDays, percent]) => ({ minDays, percent }))
    .sort((left, right) => right.minDays - left.minDays);
}

function buildDiscountBlocks(args: {
  dailyPrice: number;
  rentalDays: number;
  pricingConfig: CompanyPricingConfig;
}) {
  const discountBlocks: AppliedDiscountBlock[] = [];
  let remainingDays = args.rentalDays;

  for (const tier of buildDiscountTiers(args.pricingConfig)) {
    const blocksCount = Math.floor(remainingDays / tier.minDays);
    if (blocksCount <= 0) continue;

    const daysCovered = blocksCount * tier.minDays;
    const baseSubtotal = roundCurrency(args.dailyPrice * daysCovered);
    const discountAmount = roundCurrency(
      (baseSubtotal * tier.percent) / 100,
    );

    discountBlocks.push({
      minDays: tier.minDays,
      percent: tier.percent,
      blocksCount,
      daysCovered,
      baseSubtotal,
      discountAmount,
      discountedSubtotal: roundCurrency(baseSubtotal - discountAmount),
    });

    remainingDays -= daysCovered;
  }

  return {
    discountBlocks,
    remainingDays,
    fullPriceSubtotal: roundCurrency(args.dailyPrice * remainingDays),
  };
}

export function getCompanyPricingConfig(
  settings?: CompanySettings | null,
): CompanyPricingConfig {
  return {
    taxRatePercent: normalizePercent(
      settings?.taxRatePercent,
      COMPANY_PRICING_DEFAULTS.taxRatePercent,
    ),
    discountTier1MinDays: normalizeInteger(
      settings?.discountTier1MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier1MinDays,
      1,
    ),
    discountTier1Percent: normalizePercent(
      settings?.discountTier1Percent,
      COMPANY_PRICING_DEFAULTS.discountTier1Percent,
    ),
    discountTier2MinDays: normalizeInteger(
      settings?.discountTier2MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier2MinDays,
      1,
    ),
    discountTier2Percent: normalizePercent(
      settings?.discountTier2Percent,
      COMPANY_PRICING_DEFAULTS.discountTier2Percent,
    ),
    discountTier3MinDays: normalizeInteger(
      settings?.discountTier3MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier3MinDays,
      1,
    ),
    discountTier3Percent: normalizePercent(
      settings?.discountTier3Percent,
      COMPANY_PRICING_DEFAULTS.discountTier3Percent,
    ),
  };
}

export function calculateRentalPricing(args: {
  dailyPrice: number | string | null | undefined;
  rentalDays: number;
  settings?: CompanySettings | null;
}) {
  const dailyPrice = Number(args.dailyPrice ?? 0);
  const rentalDays = Number(args.rentalDays ?? 0);
  const pricingConfig = getCompanyPricingConfig(args.settings);

  if (!Number.isFinite(dailyPrice) || dailyPrice <= 0 || rentalDays <= 0) {
    return {
      dailyPrice: Number.isFinite(dailyPrice) ? roundCurrency(dailyPrice) : 0,
      rentalDays: Math.max(0, rentalDays),
      baseSubtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      subtotalBeforeTax: 0,
      taxRatePercent: pricingConfig.taxRatePercent,
      taxAmount: 0,
      totalPrice: 0,
      appliedTier: null as DiscountTier | null,
      discountBlocks: [] as AppliedDiscountBlock[],
      fullPriceDays: Math.max(0, rentalDays),
      fullPriceSubtotal: 0,
    };
  }

  const { discountBlocks, remainingDays, fullPriceSubtotal } =
    buildDiscountBlocks({
      dailyPrice,
      rentalDays,
      pricingConfig,
    });
  const baseSubtotal = roundCurrency(dailyPrice * rentalDays);
  const discountAmount = roundCurrency(
    discountBlocks.reduce((sum, block) => sum + block.discountAmount, 0),
  );
  const subtotalBeforeTax = roundCurrency(baseSubtotal - discountAmount);
  const taxAmount = roundCurrency(
    (subtotalBeforeTax * pricingConfig.taxRatePercent) / 100,
  );
  const totalPrice = roundCurrency(subtotalBeforeTax + taxAmount);

  return {
    dailyPrice: roundCurrency(dailyPrice),
    rentalDays,
    baseSubtotal,
    discountPercent:
      baseSubtotal > 0
        ? roundCurrency((discountAmount / baseSubtotal) * 100)
        : 0,
    discountAmount,
    subtotalBeforeTax,
    taxRatePercent: pricingConfig.taxRatePercent,
    taxAmount,
    totalPrice,
    appliedTier: discountBlocks[0]
      ? {
          minDays: discountBlocks[0].minDays,
          percent: discountBlocks[0].percent,
        }
      : null,
    discountBlocks,
    fullPriceDays: remainingDays,
    fullPriceSubtotal,
  };
}
