export const COMPANY_PRICING_DEFAULTS = {
  taxRatePercent: 0,
  discountTier1MinDays: 7,
  discountTier1Percent: 10,
  discountTier2MinDays: 30,
  discountTier2Percent: 30,
  discountTier3MinDays: 60,
  discountTier3Percent: 40,
} as const;

type CompanyPricingSettings = Partial<{
  taxRatePercent: unknown;
  discountTier1MinDays: unknown;
  discountTier1Percent: unknown;
  discountTier2MinDays: unknown;
  discountTier2Percent: unknown;
  discountTier3MinDays: unknown;
  discountTier3Percent: unknown;
}>;

export type CompanyPricingConfig = {
  taxRatePercent: number;
  discountTier1MinDays: number;
  discountTier1Percent: number;
  discountTier2MinDays: number;
  discountTier2Percent: number;
  discountTier3MinDays: number;
  discountTier3Percent: number;
};

type DiscountTier = {
  minDays: number;
  percent: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeInteger(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizePercent(value: unknown, fallback: number) {
  return normalizeInteger(value, fallback, 0, 100);
}

function resolveDiscountTier(rentalDays: number, config: CompanyPricingConfig): DiscountTier | null {
  const tiers: DiscountTier[] = [
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
  ]
    .filter((tier) => tier.minDays > 0 && tier.percent > 0)
    .sort((left, right) => right.minDays - left.minDays);

  return tiers.find((tier) => rentalDays >= tier.minDays) ?? null;
}

export function getCompanyPricingConfig(settings?: CompanyPricingSettings | null): CompanyPricingConfig {
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

export function normalizeCompanyPricingInput(settings?: CompanyPricingSettings | null) {
  if (!settings) return {};

  const payload: Record<string, number> = {};

  if (settings.taxRatePercent !== undefined) {
    payload.taxRatePercent = normalizePercent(
      settings.taxRatePercent,
      COMPANY_PRICING_DEFAULTS.taxRatePercent,
    );
  }
  if (settings.discountTier1MinDays !== undefined) {
    payload.discountTier1MinDays = normalizeInteger(
      settings.discountTier1MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier1MinDays,
      1,
    );
  }
  if (settings.discountTier1Percent !== undefined) {
    payload.discountTier1Percent = normalizePercent(
      settings.discountTier1Percent,
      COMPANY_PRICING_DEFAULTS.discountTier1Percent,
    );
  }
  if (settings.discountTier2MinDays !== undefined) {
    payload.discountTier2MinDays = normalizeInteger(
      settings.discountTier2MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier2MinDays,
      1,
    );
  }
  if (settings.discountTier2Percent !== undefined) {
    payload.discountTier2Percent = normalizePercent(
      settings.discountTier2Percent,
      COMPANY_PRICING_DEFAULTS.discountTier2Percent,
    );
  }
  if (settings.discountTier3MinDays !== undefined) {
    payload.discountTier3MinDays = normalizeInteger(
      settings.discountTier3MinDays,
      COMPANY_PRICING_DEFAULTS.discountTier3MinDays,
      1,
    );
  }
  if (settings.discountTier3Percent !== undefined) {
    payload.discountTier3Percent = normalizePercent(
      settings.discountTier3Percent,
      COMPANY_PRICING_DEFAULTS.discountTier3Percent,
    );
  }

  return payload;
}

export function calculateRentalDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.ceil((end - start) / 86_400_000);
}

export function calculateRentalPricing(args: {
  dailyPrice: number | string;
  rentalDays: number;
  settings?: CompanyPricingSettings | null;
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
    };
  }

  const appliedTier = resolveDiscountTier(rentalDays, pricingConfig);
  const baseSubtotal = roundCurrency(dailyPrice * rentalDays);
  const discountPercent = appliedTier?.percent ?? 0;
  const discountAmount = roundCurrency((baseSubtotal * discountPercent) / 100);
  const subtotalBeforeTax = roundCurrency(baseSubtotal - discountAmount);
  const taxAmount = roundCurrency(
    (subtotalBeforeTax * pricingConfig.taxRatePercent) / 100,
  );
  const totalPrice = roundCurrency(subtotalBeforeTax + taxAmount);

  return {
    dailyPrice: roundCurrency(dailyPrice),
    rentalDays,
    baseSubtotal,
    discountPercent,
    discountAmount,
    subtotalBeforeTax,
    taxRatePercent: pricingConfig.taxRatePercent,
    taxAmount,
    totalPrice,
    appliedTier,
  };
}

export function calculateIncludedTaxBreakdown(totalPaid: number, taxRatePercent: number) {
  const roundedTotalPaid = roundCurrency(totalPaid);
  const normalizedTaxRate = normalizePercent(taxRatePercent, 0);

  if (roundedTotalPaid <= 0 || normalizedTaxRate <= 0) {
    return {
      subtotalBeforeTax: roundedTotalPaid,
      taxAmount: 0,
      totalPaid: roundedTotalPaid,
    };
  }

  const subtotalBeforeTax = roundCurrency(
    roundedTotalPaid / (1 + normalizedTaxRate / 100),
  );
  const taxAmount = roundCurrency(roundedTotalPaid - subtotalBeforeTax);

  return {
    subtotalBeforeTax,
    taxAmount,
    totalPaid: roundedTotalPaid,
  };
}
