import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { ValuationMethod } from '../../types/valuation';
import type { ValuationResult } from '../../types/valuation';

/* ─── slider config per method ─── */
interface SliderDef {
  key: string;
  labelKey: string;
  min: number;
  max: number;
  step: number;
  /** Format the displayed value (default: raw number) */
  format?: (v: number) => string;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const x = (v: number) => `${v.toFixed(1)}×`;

const SLIDERS: Record<ValuationMethod, SliderDef[]> = {
  [ValuationMethod.EV_EBITDA]: [
    { key: 'multiple', labelKey: 'valuation.sensitivity.multiple', min: 2, max: 20, step: 0.5, format: x },
  ],
  [ValuationMethod.EV_REVENUE]: [
    { key: 'multiple', labelKey: 'valuation.sensitivity.multiple', min: 0.5, max: 15, step: 0.5, format: x },
  ],
  [ValuationMethod.PE_RATIO]: [
    { key: 'peRatio', labelKey: 'valuation.sensitivity.peRatio', min: 3, max: 40, step: 0.5, format: x },
  ],
  [ValuationMethod.GORDON_GROWTH]: [
    { key: 'wacc', labelKey: 'valuation.sensitivity.wacc', min: 0.04, max: 0.25, step: 0.005, format: pct },
    { key: 'growthRate', labelKey: 'valuation.sensitivity.growthRate', min: 0.005, max: 0.10, step: 0.005, format: pct },
  ],
  [ValuationMethod.ASSET_BASED]: [],
};

/* ─── client-side recalc ─── */
function recalculate(
  method: ValuationMethod,
  baseInputs: Record<string, number>,
  overrides: Record<string, number>,
): { ev: number | null; equity: number } {
  const inp = { ...baseInputs, ...overrides };

  switch (method) {
    case ValuationMethod.EV_EBITDA: {
      const ev = inp.ebitda * inp.multiple;
      return { ev, equity: ev - inp.netDebt };
    }
    case ValuationMethod.EV_REVENUE: {
      const ev = inp.revenue * inp.multiple;
      return { ev, equity: ev - inp.netDebt };
    }
    case ValuationMethod.PE_RATIO:
      return { ev: null, equity: inp.netIncome * inp.peRatio };
    case ValuationMethod.GORDON_GROWTH: {
      const denom = inp.wacc - inp.growthRate;
      if (denom <= 0) return { ev: null, equity: 0 };
      return { ev: null, equity: (inp.freeCashFlow * (1 + inp.growthRate)) / denom };
    }
    case ValuationMethod.ASSET_BASED:
      return { ev: null, equity: inp.totalAssets - inp.totalLiabilities };
    default:
      return { ev: null, equity: 0 };
  }
}

/* ─── helpers ─── */
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(v);

function changePct(original: number, adjusted: number): number {
  if (original === 0) return 0;
  return ((adjusted - original) / Math.abs(original)) * 100;
}

/* ─── component ─── */
interface Props {
  result: ValuationResult;
}

export const SensitivitySliders = ({ result }: Props) => {
  const { t } = useTranslation();
  const sliders = SLIDERS[result.method];

  // Initialize slider values from the result inputs
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    sliders.forEach((s) => {
      init[s.key] = result.inputs[s.key] ?? s.min;
    });
    return init;
  });

  const handleChange = useCallback((key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const adjusted = useMemo(
    () => recalculate(result.method, result.inputs, values),
    [result, values],
  );

  const originalEquity = result.equityValue;
  const eqChange = changePct(originalEquity, adjusted.equity);

  // Don't render for methods with no sliders
  if (sliders.length === 0) return null;

  return (
    <div className="card !p-6 space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-brand" />
        <h3 className="text-sm font-semibold text-text-main">
          {t('valuation.sensitivity.title')}
        </h3>
      </div>
      <p className="text-xs text-text-muted -mt-3">
        {t('valuation.sensitivity.adjustSliders')}
      </p>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((s) => {
          const val = values[s.key];
          const fmt = s.format ?? ((v: number) => v.toString());
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-muted">
                  {t(s.labelKey)}
                </label>
                <span className="text-xs font-mono font-semibold text-text-main">
                  {fmt(val)}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={val}
                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
                className="slider"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                <span>{fmt(s.min)}</span>
                <span>{fmt(s.max)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjusted result summary */}
      <div className="border-t border-border pt-4 space-y-3">
        {adjusted.ev !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {t('valuation.sensitivity.adjustedEV')}
            </span>
            <span className="text-sm font-semibold font-mono text-text-main">
              {formatCurrency(adjusted.ev)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {t('valuation.sensitivity.adjustedEquity')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-mono text-text-main">
              {formatCurrency(adjusted.equity)}
            </span>
            {/* Change indicator */}
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                eqChange > 0
                  ? 'text-success bg-success/10'
                  : eqChange < 0
                    ? 'text-error bg-error/10'
                    : 'text-text-muted bg-surface'
              }`}
            >
              {eqChange > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : eqChange < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              {eqChange >= 0 ? '+' : ''}{eqChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


