import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { ValuationMethod } from '../../types/valuation';
import type { ValuationResult } from '../../types/valuation';

/* ─── client-side recalculation ─── */
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

interface Props {
  result: ValuationResult;
}

export const SensitivitySliders = ({ result }: Props) => {
  const { t } = useTranslation();

  // Dynamically define dual-axis sliders based on original form inputs
  const dynamicSliders = useMemo(() => {
    const { method, inputs } = result;
    const list: { key: string; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [];

    const formatX = (v: number) => `${v.toFixed(1)}×`;
    const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

    switch (method) {
      case ValuationMethod.EV_EBITDA:
        list.push({
          key: 'multiple',
          label: t('valuation.sensitivity.multiple', 'Multiple d\'EBITDA'),
          min: Math.max(1, (inputs.multiple ?? 8) - 5),
          max: (inputs.multiple ?? 8) + 8,
          step: 0.1,
          format: formatX
        });
        list.push({
          key: 'netDebt',
          label: t('valuation.sensitivity.netDebt', 'Dette Nette'),
          min: Math.min(0, (inputs.netDebt ?? 0) * 0.5),
          max: Math.max(100000, (inputs.netDebt ?? 0) * 2),
          step: 10000,
          format: formatCurrency
        });
        break;

      case ValuationMethod.EV_REVENUE:
        list.push({
          key: 'multiple',
          label: t('valuation.sensitivity.multipleRevenue', 'Multiple de Chiffre d\'Affaires'),
          min: Math.max(0.1, (inputs.multiple ?? 3) - 2),
          max: (inputs.multiple ?? 3) + 4,
          step: 0.1,
          format: formatX
        });
        list.push({
          key: 'netDebt',
          label: t('valuation.sensitivity.netDebt', 'Dette Nette'),
          min: Math.min(0, (inputs.netDebt ?? 0) * 0.5),
          max: Math.max(100000, (inputs.netDebt ?? 0) * 2),
          step: 10000,
          format: formatCurrency
        });
        break;

      case ValuationMethod.PE_RATIO:
        list.push({
          key: 'peRatio',
          label: t('valuation.sensitivity.peRatio', 'Multiple P/E (Cours/Bénéfice)'),
          min: Math.max(2, (inputs.peRatio ?? 15) - 7),
          max: (inputs.peRatio ?? 15) + 12,
          step: 0.5,
          format: formatX
        });
        list.push({
          key: 'netIncome',
          label: t('valuation.sensitivity.netIncome', 'Résultat Net (Bénéfice)'),
          min: Math.round(inputs.netIncome * 0.5),
          max: Math.round(inputs.netIncome * 1.5),
          step: Math.round(inputs.netIncome * 0.05) || 5000,
          format: formatCurrency
        });
        break;

      case ValuationMethod.ASSET_BASED:
        list.push({
          key: 'totalAssets',
          label: t('valuation.fields.totalAssets', 'Actifs Totaux'),
          min: Math.round(inputs.totalAssets * 0.5),
          max: Math.round(inputs.totalAssets * 1.5),
          step: Math.round(inputs.totalAssets * 0.05) || 10000,
          format: formatCurrency
        });
        list.push({
          key: 'totalLiabilities',
          label: t('valuation.fields.totalLiabilities', 'Passifs Totaux (Dettes)'),
          min: Math.round(inputs.totalLiabilities * 0.5),
          max: Math.round(inputs.totalLiabilities * 1.5),
          step: Math.round(inputs.totalLiabilities * 0.05) || 10000,
          format: formatCurrency
        });
        break;

      case ValuationMethod.GORDON_GROWTH:
        list.push({
          key: 'wacc',
          label: t('valuation.fields.wacc', 'WACC (Coût du capital)'),
          min: Math.max(0.04, (inputs.wacc ?? 0.08) - 0.03),
          max: Math.min(0.25, (inputs.wacc ?? 0.08) + 0.05),
          step: 0.001,
          format: formatPct
        });
        list.push({
          key: 'growthRate',
          label: t('valuation.fields.growthRate', 'Croissance Long Terme (g)'),
          min: 0.005,
          max: Math.min((inputs.wacc ?? 0.08) - 0.005, (inputs.growthRate ?? 0.03) + 0.02),
          step: 0.001,
          format: formatPct
        });
        break;
    }

    return list;
  }, [result, t]);

  const [values, setValues] = useState<Record<string, number>>({});

  // Reset/sync slider values when primary result changes
  useEffect(() => {
    const init: Record<string, number> = {};
    dynamicSliders.forEach((s) => {
      init[s.key] = result.inputs[s.key] ?? s.min;
    });
    // Double check Gordon constraints
    if (result.method === ValuationMethod.GORDON_GROWTH) {
      init['wacc'] = result.inputs['wacc'] ?? 0.08;
      init['growthRate'] = result.inputs['growthRate'] ?? 0.03;
    }
    setValues(init);
  }, [result.inputs, dynamicSliders, result.method]);

  const handleChange = useCallback((key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const adjusted = useMemo(
    () => recalculate(result.method, result.inputs, values),
    [result, values],
  );

  // Compute boundaries for the sensitivity range
  const { minValuation, maxValuation, currentValuation } = useMemo(() => {
    if (Object.keys(values).length === 0) {
      return {
        minValuation: result.equityValue * 0.8,
        maxValuation: result.equityValue * 1.2,
        currentValuation: result.equityValue,
      };
    }

    const minOverrides: Record<string, number> = {};
    const maxOverrides: Record<string, number> = {};
    
    dynamicSliders.forEach((s) => {
      // Inverted variables (higher debt, liabilities, or cost of capital decreases equity valuation)
      if (s.key === 'netDebt' || s.key === 'totalLiabilities' || s.key === 'wacc') {
        minOverrides[s.key] = s.max;
        maxOverrides[s.key] = s.min;
      } else {
        minOverrides[s.key] = s.min;
        maxOverrides[s.key] = s.max;
      }
    });

    const minRes = recalculate(result.method, result.inputs, minOverrides);
    const maxRes = recalculate(result.method, result.inputs, maxOverrides);
    const currRes = recalculate(result.method, result.inputs, values);

    return {
      minValuation: minRes.equity,
      maxValuation: maxRes.equity,
      currentValuation: currRes.equity,
    };
  }, [result, values, dynamicSliders]);

  const percentagePosition = useMemo(() => {
    const range = maxValuation - minValuation;
    if (range <= 0) return 50;
    const pos = ((currentValuation - minValuation) / range) * 100;
    return Math.min(100, Math.max(0, pos));
  }, [minValuation, maxValuation, currentValuation]);

  const originalEquity = result.equityValue;
  const eqChange = changePct(originalEquity, currentValuation);

  if (dynamicSliders.length === 0) return null;

  return (
    <div className="card !p-6 space-y-6 border border-border bg-surface/10">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-brand animate-pulse" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          {t('valuation.sensitivity.title', 'Console de Sensibilité Double-Axe')}
        </h3>
      </div>
      <p className="text-xs text-text-muted font-medium -mt-4">
        {t('valuation.sensitivity.adjustSliders', 'Ajustez simultanément les leviers financiers clés pour évaluer l\'impact en temps réel.')}
      </p>

      {/* Sliders Console */}
      <div className="space-y-4">
        {dynamicSliders.map((s) => {
          const val = values[s.key] ?? result.inputs[s.key] ?? s.min;
          const fmt = s.format;
          return (
            <div key={s.key} className="p-3.5 rounded-xl bg-surface/50 border border-border/20">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {s.label}
                </label>
                <span className="text-xs font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
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
                className="slider cursor-pointer w-full accent-brand"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-semibold mt-1">
                <span>{fmt(s.min)}</span>
                <span>{fmt(s.max)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Valuation Interval Glowing Bar */}
      <div className="p-4 rounded-xl bg-surface/60 border border-border/30 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
          <span>{t('valuation.sensitivity.boundsTitle', 'Intervalle de Confiance de l\'Évaluation')}</span>
          <span className="text-[#00D1FF] font-mono font-bold text-sm">{formatCurrency(currentValuation)}</span>
        </div>
        
        <div className="relative pt-2">
          {/* Bar track */}
          <div className="h-2 w-full rounded-full bg-border/20 relative overflow-hidden">
            {/* Glowing filled range */}
            <div 
              className="h-full bg-gradient-to-r from-brand/60 to-[#00D1FF] rounded-full shadow-[0_0_12px_rgba(0,209,255,0.45)]"
              style={{ width: `${percentagePosition}%` }}
            />
          </div>
          
          {/* Slider indicator node */}
          <div 
            className="absolute top-1.5 w-3 h-3 rounded-full bg-[#00D1FF] border-2 border-white shadow-[0_0_12px_#00D1FF] transition-all duration-150"
            style={{ left: `calc(${percentagePosition}% - 6px)` }}
          />
        </div>
        
        {/* Bounds Labels */}
        <div className="flex justify-between text-[10px] text-text-muted font-bold tracking-wide">
          <div className="text-left">
            <span className="block text-[8px] uppercase tracking-wider text-text-muted mb-0.5">Valeur Minimale (Min)</span>
            <span className="font-mono text-text-secondary">{formatCurrency(minValuation)}</span>
          </div>
          <div className="text-right">
            <span className="block text-[8px] uppercase tracking-wider text-text-muted mb-0.5">Valeur Maximale (Max)</span>
            <span className="font-mono text-text-secondary">{formatCurrency(maxValuation)}</span>
          </div>
        </div>
      </div>

      {/* Adjusted result summary */}
      <div className="border-t border-border/40 pt-4 space-y-3">
        {adjusted.ev !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t('valuation.sensitivity.adjustedEV', 'Valeur d\'Entreprise Ajustée')}
            </span>
            <span className="text-sm font-bold font-mono text-text-primary">
              {formatCurrency(adjusted.ev)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t('valuation.sensitivity.adjustedEquity', 'Valeur des Capitaux Propres Ajustée')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-[#00D1FF]">
              {formatCurrency(currentValuation)}
            </span>
            {/* Change indicator */}
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                eqChange > 0
                  ? 'text-success bg-success/10 border border-success/20'
                  : eqChange < 0
                    ? 'text-error bg-error/10 border border-error/20'
                    : 'text-text-secondary bg-surface border border-border/40'
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
