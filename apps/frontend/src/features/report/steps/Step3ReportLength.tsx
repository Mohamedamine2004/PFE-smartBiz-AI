import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';

const PAGE_COUNTS = [
  { value: 10 as const, label: 'Short', desc: 'Essential insights and key findings' },
  { value: 20 as const, label: 'Standard', desc: 'Comprehensive analysis with details' },
  { value: 30 as const, label: 'Comprehensive', desc: 'In-depth analysis with all sections' },
] as const;

export const Step3ReportLength = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleSelect = (count: 10 | 20 | 30) => {
    setState({ ...state, pageCount: count });
    setErrors({ ...errors, pageCount: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step3.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step3.description', 'Select your preferred report length')}
        </p>
      </div>

      <div className="space-y-3">
        {PAGE_COUNTS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              state.pageCount === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900">{option.label}</h3>
                <p className="text-sm text-slate-600 mt-1">{option.desc}</p>
              </div>
              <div className="text-sm font-semibold text-slate-700">{option.value} pages</div>
            </div>
          </button>
        ))}
      </div>

      {errors.pageCount && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.pageCount}</div>
      )}
    </div>
  );
};
