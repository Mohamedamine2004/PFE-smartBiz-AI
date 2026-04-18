import type { ViewMode } from './revenueProjectionChart.utils';
import { useTranslation } from 'react-i18next';

interface ProjectionTooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string;
  viewMode: ViewMode;
}

export const RevenueProjectionTooltip = ({
  active,
  payload,
  label,
  viewMode,
}: ProjectionTooltipProps) => {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length) return null;

  const isHistory = payload[0]?.payload?.isHistory;

  return (
    <div className="chart-tooltip bg-surface border border-border shadow-xl p-3 rounded-xl z-50 min-w-[200px]">
      <p className="text-sm font-bold text-text-primary mb-2">
        {label}
        {isHistory && (
          <span className="opacity-60 text-[10px] font-normal uppercase tracking-wider ml-2">
            ({label === 'Current' ? t('dashboard.mlZone.baseYear') : t('dashboard.mlZone.historical')})
          </span>
        )}
      </p>

      {viewMode === 'valuation' && payload[0]?.payload && (
        <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-text-main">{t('dashboard.mlZone.enterpriseValue')}</span>
          </div>
          <span className="text-sm font-black tabular-nums text-text-main">
            {(payload[0].payload.enterprise || 0).toLocaleString(i18n.resolvedLanguage || undefined, {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      )}

      {payload.map((entry: any, i: number) => {
        if (viewMode === 'revenue' && isHistory && entry.name !== 'Realistic') return null;

        return (
          <div key={`${entry.name}-${i}`} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-xs font-medium text-text-secondary">
                {isHistory && viewMode === 'revenue' ? t('dashboard.mlZone.historicalActual') : entry.name}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums text-text-main">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString(i18n.resolvedLanguage || undefined, {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })
                : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};
