/**
 * Shared number formatting utilities.
 * Used by KPI cards, charts, import history, and valuation components.
 */

/** Compact number: 1234567 → "1.2M", 5432 → "5.4K" */
export const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '\u2014';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('fr-FR');
};

/** Decimal → percentage: 0.153 → "15.3%" */
export const formatPercent = (value: number | null | undefined): string => {
  if (value == null) return '\u2014';
  return `${(value * 100).toFixed(1)}%`;
};

/** Currency with locale grouping: 1234567 → "1,234,567" */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);

/** Relative date: "Today", "Yesterday", "3 days ago", or formatted date */
export const getRelativeDate = (
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('dashboard.history.today');
  if (diffDays === 1) return t('dashboard.history.yesterday');
  if (diffDays <= 7) return t('dashboard.history.daysAgo', { count: diffDays });

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
