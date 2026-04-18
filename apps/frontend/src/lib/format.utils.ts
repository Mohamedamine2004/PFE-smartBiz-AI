/**
 * Shared formatting utilities used across the entire frontend.
 * Single source of truth for number/currency display logic.
 */

const getLocale = (): string => {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang;
  }
  return 'en-US';
};

/** Format a number as compact USD currency ($1.2M, $450K, etc.) */
export const formatCompactCurrency = (
  value: number,
  currency = 'USD',
): string => {
  return value.toLocaleString(getLocale(), {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
};

/** Format a number as full USD currency ($1,234,567) */
export const formatFullCurrency = (
  value: number,
  currency = 'USD',
): string =>
  value.toLocaleString(getLocale(), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

/** Format with a custom currency symbol (for company-specific currencies) */
export const formatWithSymbol = (value: number, symbol = '€'): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${symbol}`;
  return `${value.toLocaleString(getLocale())} ${symbol}`;
};

/** Compact Y-axis tick formatter for Recharts */
export const formatAxisTick = (v: number): string => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

/** Safely parse a metric value from ChartDataPoint (handles string | number | undefined) */
export const parseMetricValue = (
  value: string | number | undefined,
): { text: string; raw: number; isNegative: boolean } => {
  if (typeof value === 'number') {
    return {
      text: value.toLocaleString(getLocale(), { maximumFractionDigits: 2 }),
      raw: value,
      isNegative: value < 0,
    };
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return {
        text: parsed.toLocaleString(getLocale(), { maximumFractionDigits: 2 }),
        raw: parsed,
        isNegative: parsed < 0,
      };
    }
  }
  return { text: 'N/A', raw: 0, isNegative: false };
};

/** Extract a numeric value from a ChartDataPoint field */
export const getMetricNumber = (
  point: Record<string, unknown>,
  key: string,
): number => {
  const val = point[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tries to extract a metric value using an array of possible key aliases */
export const getMetricByAliases = (
  point: Record<string, unknown>,
  candidateKeys: string[],
): number => {
  const entries = Object.entries(point);
  for (const candidate of candidateKeys) {
    const exact = point[candidate];
    if (typeof exact === 'number') return exact;
    if (typeof exact === 'string' && exact.trim() !== '') {
      const parsed = Number(exact);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const normalizedCandidate = normalizeKey(candidate);
    const matched = entries.find(([key]) => normalizeKey(key) === normalizedCandidate)?.[1];
    if (typeof matched === 'number') return matched;
    if (typeof matched === 'string' && matched.trim() !== '') {
      const parsed = Number(matched);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
};
