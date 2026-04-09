import { useTranslation } from 'react-i18next';
import { TrendingUp, Landmark, BookOpen, HelpCircle } from 'lucide-react';
import { Tooltip } from '../ui';
import type { ValuationResult } from '../../types/valuation';

interface Props {
  result: ValuationResult;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(value);
};

export const ValuationResultCard = ({ result }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Value cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Enterprise Value */}
        {result.enterpriseValue !== null && (
          <div className="glow-card !p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                {t('valuation.enterpriseValue')}
              </span>
              <Tooltip content={t('valuation.evDescription')}>
                <HelpCircle className="w-3 h-3 text-text-muted/50 cursor-help" />
              </Tooltip>
            </div>
            <p className="text-2xl font-semibold text-text-main tracking-tight">
              {formatCurrency(result.enterpriseValue)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t('valuation.evDescription')}
            </p>
          </div>
        )}

        {/* Equity Value */}
        <div className="glow-card !p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand" />
            </div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {t('valuation.equityValue')}
            </span>
          </div>
          <p className="text-2xl font-semibold text-text-main tracking-tight">
            {formatCurrency(result.equityValue)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t('valuation.equityDescription')}
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="card !p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          {t('valuation.formulaApplied')}
        </p>
        <p className="font-mono text-sm text-text-main leading-relaxed">
          {result.formula}
        </p>
      </div>

      {/* Explanation */}
      <div className="card !p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
              {t('valuation.explanation')}
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              {result.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


