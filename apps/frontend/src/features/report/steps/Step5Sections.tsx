import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { WizardStepProps } from '../types';
import { ReportSection } from '../../../types/report';

const SECTIONS = [
  {
    value: ReportSection.EXECUTIVE_SUMMARY,
    label: 'Executive Summary',
    desc: 'High-level overview and key findings',
  },
  { value: ReportSection.SWOT_ANALYSIS, label: 'SWOT Analysis', desc: 'Strengths, weaknesses, opportunities, threats' },
  {
    value: ReportSection.PERFORMANCE_ANALYSIS,
    label: 'Performance Analysis',
    desc: 'Detailed performance metrics and trends',
  },
  {
    value: ReportSection.FINANCIAL_OVERVIEW,
    label: 'Financial Overview',
    desc: 'Financial health and key indicators',
  },
  { value: ReportSection.RECOMMENDATIONS, label: 'Recommendations', desc: 'Actionable recommendations' },
  { value: ReportSection.FORECASTS_TRENDS, label: 'Forecasts & Trends', desc: 'Future outlook and market trends' },
] as const;

export const Step5Sections = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const toggleSection = (section: ReportSection) => {
    const newSections = state.sections.includes(section)
      ? state.sections.filter((s) => s !== section)
      : [...state.sections, section];

    setState({ ...state, sections: newSections });
    setErrors({ ...errors, sections: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step5.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step5.description', 'Select sections to include in your report')}
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <button
            key={section.value}
            onClick={() => toggleSection(section.value)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-3 ${state.sections.includes(section.value)
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${state.sections.includes(section.value)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-slate-300 bg-white'
                }`}
            >
              {state.sections.includes(section.value) && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{section.label}</h3>
              <p className="text-sm text-slate-600 mt-1">{section.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {errors.sections && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.sections}</div>
      )}

      <div className="text-sm text-slate-600">
        {t('wizard.step5.selected', 'Selected sections')}: <span className="font-semibold">{state.sections.length}</span>
      </div>
    </div>
  );
};
