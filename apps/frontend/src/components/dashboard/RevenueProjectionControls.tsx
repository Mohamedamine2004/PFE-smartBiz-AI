import { BarChart4, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from './revenueProjectionChart.utils';

interface RevenueProjectionControlsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeScenarioId: 'realistic' | 'optimistic' | 'pessimistic';
  setActiveScenarioId: (scenario: 'realistic' | 'optimistic' | 'pessimistic') => void;
  exitMultiple: number;
  setExitMultiple: (v: number) => void;
  debtY1: number;
  setDebtY1: (v: number) => void;
  debtY2: number;
  setDebtY2: (v: number) => void;
  maxDebtY1: number;
  maxDebtY2: number;
}

export const RevenueProjectionControls = ({
  viewMode,
  setViewMode,
  activeScenarioId,
  setActiveScenarioId,
  exitMultiple,
  setExitMultiple,
  debtY1,
  setDebtY1,
  debtY2,
  setDebtY2,
  maxDebtY1,
  maxDebtY2,
}: RevenueProjectionControlsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            {viewMode === 'revenue' ? (
              <>
                <TrendingUp className="w-5 h-5 text-brand" />
                {t('dashboard.mlZone.revenueProjection', 'Revenue Projection')}
              </>
            ) : (
              <>
                <BarChart4 className="w-5 h-5 text-amber-500" />
                {t('dashboard.mlZone.valuationSimulator', 'Valuation & Liquidity Simulator')}
              </>
            )}
          </h3>
          <p className="text-xs font-medium text-text-muted">
            {viewMode === 'revenue'
              ? t('dashboard.mlZone.revenueHint', 'Observe the AI-driven top-line growth forecast boundaries.')
              : t('dashboard.mlZone.valuationHint', 'Interactive modeling dividing Enterprise value into Equity & Debt.')}
          </p>
        </div>

        <div className="flex p-1 bg-surface border border-border rounded-xl shadow-sm self-start">
          <button
            onClick={() => setViewMode('revenue')}
            className={`px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold transition-all rounded-lg ${viewMode === 'revenue' ? 'bg-brand text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.mlZone.revenueMode')}
          </button>
          <button
            onClick={() => setViewMode('valuation')}
            className={`px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold transition-all rounded-lg ${viewMode === 'valuation' ? 'bg-amber-600 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.mlZone.valuationMode')}
          </button>
        </div>
      </div>

      {viewMode === 'valuation' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-wrap items-center gap-3 mb-5 p-3.5 bg-brand/5 border border-brand/20 rounded-xl">
            <SlidersHorizontal className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-main">{t('dashboard.mlZone.baseScenario')}</span>
            <div className="flex flex-wrap gap-2">
              {(['pessimistic', 'realistic', 'optimistic'] as const).map((scen) => (
                <button
                  key={scen}
                  onClick={() => setActiveScenarioId(scen)}
                  className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-lg border transition-all ${
                    activeScenarioId === scen
                      ? scen === 'optimistic'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        : scen === 'pessimistic'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400'
                          : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-transparent border-border hover:bg-surface-hover text-text-muted'
                  }`}
                >
                  {t(`dashboard.mlZone.scenarios.${scen}`)}
                </button>
              ))}
            </div>
            <p className="w-full lg:w-auto lg:ml-auto text-xs font-semibold text-text-muted">{t('dashboard.mlZone.drivesValuation')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              {
                title: t('dashboard.mlZone.exitMultiple'),
                state: exitMultiple,
                setState: setExitMultiple,
                min: 1,
                max: 12,
                step: 0.1,
                suffix: 'x',
              },
              {
                title: t('dashboard.mlZone.projectedDebtY1'),
                state: debtY1,
                setState: setDebtY1,
                min: 0,
                max: maxDebtY1,
                step: 5000,
                suffix: '$',
              },
              {
                title: t('dashboard.mlZone.projectedDebtY2'),
                state: debtY2,
                setState: setDebtY2,
                min: 0,
                max: maxDebtY2,
                step: 5000,
                suffix: '$',
              },
            ].map((slider, idx) => (
              <label key={idx} className="block rounded-xl border border-border bg-surface p-4 space-y-4 cursor-pointer hover:border-brand/30 transition-colors shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{slider.title}</span>
                  <span className="text-sm font-black text-text-main tabular-nums">
                    {slider.suffix === '$'
                      ? slider.state.toLocaleString(undefined, { notation: 'compact', style: 'currency', currency: 'USD' })
                      : `${slider.state.toFixed(1)}${slider.suffix}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={slider.state}
                  onChange={(e) => slider.setState(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
