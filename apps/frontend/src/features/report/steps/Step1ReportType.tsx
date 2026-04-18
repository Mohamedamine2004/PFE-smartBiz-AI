import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportType } from '../../../types/report';

const REPORT_TYPES = [
  { value: ReportType.FINANCIAL, label: 'Financial', desc: 'Focus on financial metrics and analysis' },
  { value: ReportType.BUSINESS_DESCRIPTION, label: 'Marketing', desc: 'Marketing strategy and customer analysis' },
  { value: ReportType.ACTION_PLAN, label: 'Strategic', desc: 'Strategic planning and market positioning' },
  { value: ReportType.RISK_ANALYSIS, label: 'Operational', desc: 'Operations and process optimization' },
] as const;

export const Step1ReportType = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleSelect = (type: ReportType) => {
    setState({ ...state, reportType: type });
    setErrors({ ...errors, reportType: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step1.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step1.description', 'Select the type of report that best fits your needs')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => handleSelect(type.value as ReportType)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              state.reportType === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <h3 className="font-semibold text-slate-900 mb-1">{type.label}</h3>
            <p className="text-sm text-slate-600">{type.desc}</p>
          </button>
        ))}
      </div>

      {errors.reportType && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.reportType}</div>
      )}
    </div>
  );
};
