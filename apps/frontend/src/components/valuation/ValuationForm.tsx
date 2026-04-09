import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { Button, Tooltip } from '../ui';
import { ValuationMethod } from '../../types/valuation';
import type { ValuationInputs } from '../../types/valuation';

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
      step: '0.01',
      tooltipKey: 'valuation.tooltips.growthRate',
    },
    {
      key: 'wacc',
      labelKey: 'valuation.fields.wacc',
      placeholderKey: 'valuation.placeholders.wacc',
      step: '0.01',
      tooltipKey: 'valuation.tooltips.wacc',
    },
  ],
};

interface Props {
  method: ValuationMethod;
  onSubmit: (inputs: ValuationInputs) => void;
  loading: boolean;
}

export const ValuationForm = ({ method, onSubmit, loading }: Props) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = FIELDS_BY_METHOD[method] || [];

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      const val = values[f.key]?.trim();
      const label = t(f.labelKey);
      if (!val) {
        newErrors[f.key] = t('valuation.fieldRequired', { field: label });
      } else if (isNaN(Number(val))) {
        newErrors[f.key] = t('valuation.fieldNumeric', { field: label });
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
      {fields.map((f) => (
        <div key={f.key}>
          <label className="flex items-center gap-1.5 text-sm font-medium text-text-main mb-1.5">
            {t(f.labelKey)}
            <Tooltip content={t(f.tooltipKey)}>
              <span className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
              </span>
            </Tooltip>
          </label>
          <input
            type="number"
            step={f.step ?? 'any'}
            placeholder={t(f.placeholderKey)}
            value={values[f.key] ?? ''}
            onChange={(e) => handleChange(f.key, e.target.value)}
            className={`input ${
              errors[f.key] ? '!border-error focus:!shadow-none' : ''
            }`}
          />
          {errors[f.key] && (
            <p className="mt-1 text-xs text-error">{errors[f.key]}</p>
          )}
        </div>
      ))}

      <Button type="submit" loading={loading} fullWidth>
        {t('valuation.calculateButton')}
      </Button>
    </form>
  );
};


