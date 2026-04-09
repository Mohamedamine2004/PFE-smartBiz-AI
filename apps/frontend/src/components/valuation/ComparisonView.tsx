import { useTranslation } from 'react-i18next';
import { GitCompareArrows, Landmark, TrendingUp } from 'lucide-react';
import type { ValuationResult } from '../../types/valuation';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(v);

const METHOD_LABELS: Record<string, string> = {
  EV_EBITDA: 'EV / EBITDA',
  EV_REVENUE: 'EV / Revenue',
  PE_RATIO: 'P/E Ratio',
  ASSET_BASED: 'Asset-Based',
  GORDON_GROWTH: 'Gordon Growth',
};

interface Props {
  primary: ValuationResult;
  compare: ValuationResult;
}

export const ComparisonView = ({ primary, compare }: Props) => {
  const { t } = useTranslation();

  const maxEquity = Math.max(
    Math.abs(primary.equityValue),
    Math.abs(compare.equityValue),
  );

  const barWidth = (val: number) =>
    maxEquity > 0 ? `${(Math.abs(val) / maxEquity) * 100}%` : '0%';

  const diff = compare.equityValue - primary.equityValue;
  const diffPct =
    primary.equityValue !== 0
      ? ((diff / Math.abs(primary.equityValue)) * 100).toFixed(1)
      : '—';

  return (
    <div className="card !p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitCompareArrows className="w-4 h-4 text-secondary" />
        <h3 className="text-sm font-semibold text-text-main">
          {t('valuation.compare.title')}
        </h3>
      </div>

      {/* Side-by-side table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-text-muted py-2 pr-4">
                &nbsp;
              </th>
              <th className="text-left text-xs font-medium text-brand py-2 pr-4">
                {METHOD_LABELS[primary.method] ?? primary.method}
              </th>
              <th className="text-left text-xs font-medium text-secondary py-2">
                {METHOD_LABELS[compare.method] ?? compare.method}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Enterprise Value */}
            <tr className="border-b border-border/50">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Landmark className="w-3 h-3" />
                  {t('valuation.enterpriseValue')}
                </div>
              </td>
              <td className="py-3 pr-4 font-mono text-sm text-text-main">
                {primary.enterpriseValue !== null
                  ? fmt(primary.enterpriseValue)
                  : '—'}
              </td>
              <td className="py-3 font-mono text-sm text-text-main">
                {compare.enterpriseValue !== null
                  ? fmt(compare.enterpriseValue)
                  : '—'}
              </td>
            </tr>
            {/* Equity Value */}
            <tr>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <TrendingUp className="w-3 h-3" />
                  {t('valuation.equityValue')}
                </div>
              </td>
              <td className="py-3 pr-4 font-mono text-sm font-semibold text-text-main">
                {fmt(primary.equityValue)}
              </td>
              <td className="py-3 font-mono text-sm font-semibold text-text-main">
                {fmt(compare.equityValue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual bar comparison */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {t('valuation.compare.equityComparison')}
        </p>
        {/* Primary bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-brand font-medium">
              {METHOD_LABELS[primary.method]}
            </span>
            <span className="text-xs font-mono text-text-main">
              {fmt(primary.equityValue)}
            </span>
          </div>
          <div className="h-6 bg-border/30 rounded-md overflow-hidden">
            <div
              className="h-full bg-brand/20 border border-brand/40 rounded-md transition-all duration-500"
              style={{ width: barWidth(primary.equityValue) }}
            />
          </div>
        </div>
        {/* Compare bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-secondary font-medium">
              {METHOD_LABELS[compare.method]}
            </span>
            <span className="text-xs font-mono text-text-main">
              {fmt(compare.equityValue)}
            </span>
          </div>
          <div className="h-6 bg-border/30 rounded-md overflow-hidden">
            <div
              className="h-full bg-secondary/20 border border-secondary/40 rounded-md transition-all duration-500"
              style={{ width: barWidth(compare.equityValue) }}
            />
          </div>
        </div>
      </div>

      {/* Difference */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-text-muted">
          {t('valuation.compare.difference')}
        </span>
        <span
          className={`text-sm font-semibold font-mono ${
            diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-text-muted'
          }`}
        >
          {diff >= 0 ? '+' : ''}
          {fmt(diff)} ({diffPct}%)
        </span>
      </div>
    </div>
  );
};


