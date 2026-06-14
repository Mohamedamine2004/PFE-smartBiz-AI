import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Sparkles, Database } from 'lucide-react';
import { Button, Tooltip } from '../ui';
import { ValuationMethod } from '../../types/valuation';
import type { ValuationInputs } from '../../types/valuation';
import type { DashboardMetrics } from '../../types/dashboard';

interface FieldConfig {
  key: string;
  labelKey: string;
  placeholderKey: string;
  step?: string;
  tooltipKey: string;
}

const FIELDS_BY_METHOD: Record<ValuationMethod, FieldConfig[]> = {
  [ValuationMethod.EV_EBITDA]: [
    {
      key: 'ebitda',
      labelKey: 'valuation.fields.ebitda',
      placeholderKey: 'valuation.placeholders.ebitda',
      tooltipKey: 'valuation.tooltips.ebitda',
    },
    {
      key: 'multiple',
      labelKey: 'valuation.fields.multiple',
      placeholderKey: 'valuation.placeholders.multiple_ebitda',
      step: '0.1',
      tooltipKey: 'valuation.tooltips.multiple_ebitda',
    },
    {
      key: 'netDebt',
      labelKey: 'valuation.fields.netDebt',
      placeholderKey: 'valuation.placeholders.netDebt',
      tooltipKey: 'valuation.tooltips.netDebt',
    },
  ],
  [ValuationMethod.EV_REVENUE]: [
    {
      key: 'revenue',
      labelKey: 'valuation.fields.revenue',
      placeholderKey: 'valuation.placeholders.revenue',
      tooltipKey: 'valuation.tooltips.revenue',
    },
    {
      key: 'multiple',
      labelKey: 'valuation.fields.multiple',
      placeholderKey: 'valuation.placeholders.multiple_revenue',
      step: '0.1',
      tooltipKey: 'valuation.tooltips.multiple_revenue',
    },
    {
      key: 'netDebt',
      labelKey: 'valuation.fields.netDebt',
      placeholderKey: 'valuation.placeholders.netDebt',
      tooltipKey: 'valuation.tooltips.netDebt',
    },
  ],
  [ValuationMethod.PE_RATIO]: [
    {
      key: 'netIncome',
      labelKey: 'valuation.fields.netIncome',
      placeholderKey: 'valuation.placeholders.netIncome',
      tooltipKey: 'valuation.tooltips.netIncome',
    },
    {
      key: 'peRatio',
      labelKey: 'valuation.fields.peRatio',
      placeholderKey: 'valuation.placeholders.peRatio',
      step: '0.1',
      tooltipKey: 'valuation.tooltips.peRatio',
    },
  ],
  [ValuationMethod.ASSET_BASED]: [
    {
      key: 'totalAssets',
      labelKey: 'valuation.fields.totalAssets',
      placeholderKey: 'valuation.placeholders.totalAssets',
      tooltipKey: 'valuation.tooltips.totalAssets',
    },
    {
      key: 'totalLiabilities',
      labelKey: 'valuation.fields.totalLiabilities',
      placeholderKey: 'valuation.placeholders.totalLiabilities',
      tooltipKey: 'valuation.tooltips.totalLiabilities',
    },
  ],
  [ValuationMethod.GORDON_GROWTH]: [
    {
      key: 'freeCashFlow',
      labelKey: 'valuation.fields.freeCashFlow',
      placeholderKey: 'valuation.placeholders.freeCashFlow',
      tooltipKey: 'valuation.tooltips.freeCashFlow',
    },
    {
      key: 'growthRate',
      labelKey: 'valuation.fields.growthRate',
      placeholderKey: 'valuation.placeholders.growthRate',
      step: '0.001',
      tooltipKey: 'valuation.tooltips.growthRate',
    },
    {
      key: 'wacc',
      labelKey: 'valuation.fields.wacc',
      placeholderKey: 'valuation.placeholders.wacc',
      step: '0.001',
      tooltipKey: 'valuation.tooltips.wacc',
    },
  ],
};

interface Props {
  method: ValuationMethod;
  onSubmit: (inputs: ValuationInputs) => void;
  loading: boolean;
  importedMetrics?: DashboardMetrics | null;
}

export const ValuationForm = ({ method, onSubmit, loading, importedMetrics }: Props) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [injectedKeys, setInjectedKeys] = useState<string[]>([]);

  // Clear values on method change
  useEffect(() => {
    setValues({});
    setErrors({});
    setInjectedKeys([]);
  }, [method]);

  const fields = FIELDS_BY_METHOD[method] || [];
  const macro = importedMetrics?.macroFeatures;
  const hasImportedData = !!macro;

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleInject = () => {
    if (!macro) return;
    const newValues: Record<string, string> = { ...values };
    const affectedKeys: string[] = [];

    const formatNum = (val?: number) => (val !== undefined ? Math.round(val).toString() : '');

    if (method === ValuationMethod.EV_EBITDA) {
      // EBIT or 20% of Revenue as proxy
      const ebitdaVal = macro.OperatingIncome_N !== undefined && macro.OperatingIncome_N > 0
        ? macro.OperatingIncome_N 
        : (macro.Revenues_N !== undefined ? macro.Revenues_N * 0.20 : 0);
      newValues['ebitda'] = Math.round(ebitdaVal).toString();
      affectedKeys.push('ebitda');

      const netDebtVal = (macro.Liabilities_N ?? 0) - (macro.CashAndEquivalents_N ?? 0);
      newValues['netDebt'] = Math.round(netDebtVal).toString();
      affectedKeys.push('netDebt');
    } else if (method === ValuationMethod.EV_REVENUE) {
      newValues['revenue'] = formatNum(macro.Revenues_N);
      affectedKeys.push('revenue');

      const netDebtVal = (macro.Liabilities_N ?? 0) - (macro.CashAndEquivalents_N ?? 0);
      newValues['netDebt'] = Math.round(netDebtVal).toString();
      affectedKeys.push('netDebt');
    } else if (method === ValuationMethod.PE_RATIO) {
      newValues['netIncome'] = formatNum(macro.NetIncome_N);
      affectedKeys.push('netIncome');
    } else if (method === ValuationMethod.ASSET_BASED) {
      newValues['totalAssets'] = formatNum(macro.Assets_N);
      affectedKeys.push('totalAssets');
      newValues['totalLiabilities'] = formatNum(macro.Liabilities_N);
      affectedKeys.push('totalLiabilities');
    } else if (method === ValuationMethod.GORDON_GROWTH) {
      newValues['freeCashFlow'] = formatNum(macro.OperatingCashFlow_N ?? macro.NetIncome_N);
      affectedKeys.push('freeCashFlow');
      
      // Default standard values for rates to help user get started quickly
      if (!values['growthRate']) {
        newValues['growthRate'] = '0.03';
        affectedKeys.push('growthRate');
      }
      if (!values['wacc']) {
        newValues['wacc'] = '0.08';
        affectedKeys.push('wacc');
      }
    }

    setValues(newValues);
    setInjectedKeys(affectedKeys);
    
    // Clear animation after glow duration
    setTimeout(() => {
      setInjectedKeys([]);
    }, 1500);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      const val = values[f.key]?.trim();
      const label = t(f.labelKey);
      if (!val) {
        newErrors[f.key] = t('valuation.fieldRequired', { field: label });
      } else if (isNaN(Number(val))) {
        newErrors[f.key] = t('valuation.fieldNumeric', { field: label });
      } else if (f.key === 'growthRate' || f.key === 'wacc') {
        const numVal = Number(val);
        if (numVal < 0 || numVal > 1) {
          newErrors[f.key] = t('valuation.percentageError', 'Value must be between 0 and 1 (e.g. 0.08 for 8%)');
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numericInputs: Record<string, number> = {};
    fields.forEach((f) => {
      numericInputs[f.key] = Number(values[f.key]);
    });

    onSubmit({ method, ...numericInputs } as ValuationInputs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Real-time imported data spotlight card */}
      {hasImportedData && (
        <div className="p-3.5 rounded-xl border border-brand/20 bg-brand/5 relative overflow-hidden group transition-all duration-300 hover:border-brand/40">
          <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent opacity-50 pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
                <Database className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-text-primary">
                  {t('valuation.importedDataAvailable', 'Données d\'importation détectées')}
                </h5>
                <p className="text-[10px] text-text-muted font-medium">
                  {t('valuation.importedDataDesc', 'Pre-remplir les données financières en un clic')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInject}
              className="px-3 py-1 rounded-lg bg-brand hover:bg-brand/90 text-white text-[10px] font-bold shadow-[0_0_10px_var(--color-brand-dim)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {t('valuation.injectButton', 'Injecter')}
            </button>
          </div>
        </div>
      )}

      {fields.map((f) => (
        <div key={f.key}>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            {t(f.labelKey)}
            <Tooltip content={t(f.tooltipKey)}>
              <span className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-secondary transition-colors" />
              </span>
            </Tooltip>
          </label>
          <input
            type="number"
            step={f.step ?? 'any'}
            placeholder={t(f.placeholderKey)}
            value={values[f.key] ?? ''}
            onChange={(e) => handleChange(f.key, e.target.value)}
            className={`input transition-all duration-500 ${
              errors[f.key] ? '!border-error focus:!shadow-none' : ''
            } ${
              injectedKeys.includes(f.key)
                ? '!border-[#00D1FF] !ring-2 !ring-[#00D1FF]/40 shadow-[0_0_15px_rgba(0,209,255,0.4)] bg-[#00D1FF]/5'
                : ''
            }`}
          />
          {errors[f.key] && (
            <p className="mt-1 text-xs text-error font-medium">{errors[f.key]}</p>
          )}

          {/* Sector suggestion chips */}
          {f.key === 'multiple' && method === ValuationMethod.EV_EBITDA && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider self-center mr-1">{t('valuation.sectorMultiples', 'Multiples Sectoriels :')}</span>
              {[
                { label: 'SaaS', val: '8.0' },
                { label: 'Tech', val: '6.5' },
                { label: 'Services', val: '5.0' },
                { label: 'Retail', val: '4.0' }
              ].map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleChange('multiple', s.val)}
                  className="px-2 py-0.5 rounded-lg bg-surface border border-border/40 hover:border-brand/40 text-[10px] text-text-secondary hover:text-brand transition-all font-semibold hover:bg-brand/5"
                >
                  {s.label} {s.val}x
                </button>
              ))}
            </div>
          )}

          {f.key === 'multiple' && method === ValuationMethod.EV_REVENUE && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider self-center mr-1">{t('valuation.sectorMultiples', 'Multiples Sectoriels :')}</span>
              {[
                { label: 'SaaS', val: '6.0' },
                { label: 'Tech', val: '4.0' },
                { label: 'Services', val: '2.0' },
                { label: 'Retail', val: '1.0' }
              ].map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleChange('multiple', s.val)}
                  className="px-2 py-0.5 rounded-lg bg-surface border border-border/40 hover:border-brand/40 text-[10px] text-text-secondary hover:text-brand transition-all font-semibold hover:bg-brand/5"
                >
                  {s.label} {s.val}x
                </button>
              ))}
            </div>
          )}

          {f.key === 'peRatio' && method === ValuationMethod.PE_RATIO && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider self-center mr-1">{t('valuation.sectorRatios', 'Ratios Sectoriels :')}</span>
              {[
                { label: 'SaaS', val: '30.0' },
                { label: 'Tech', val: '22.0' },
                { label: 'Services', val: '15.0' },
                { label: 'Retail', val: '12.0' }
              ].map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleChange('peRatio', s.val)}
                  className="px-2 py-0.5 rounded-lg bg-surface border border-border/40 hover:border-brand/40 text-[10px] text-text-secondary hover:text-brand transition-all font-semibold hover:bg-brand/5"
                >
                  {s.label} {s.val}x
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <Button type="submit" loading={loading} fullWidth>
        {t('valuation.calculateButton')}
      </Button>
    </form>
  );
};
