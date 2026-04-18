import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import type { WizardStepProps } from '../types';

export const Step7Confirmation = ({ state }: WizardStepProps) => {
  const { t } = useTranslation();

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      EXECUTIVE_SUMMARY: 'Executive Summary',
      SWOT_ANALYSIS: 'SWOT Analysis',
      PERFORMANCE_ANALYSIS: 'Performance Analysis',
      FINANCIAL_OVERVIEW: 'Financial Overview',
      RECOMMENDATIONS: 'Recommendations',
      FORECASTS_TRENDS: 'Forecasts & Trends',
    };
    return labels[section] || section;
  };

  const summaryItems = [
    { label: 'Report Type', value: state.reportType },
    { label: 'Language', value: state.language },
    { label: 'Report Length', value: `${state.pageCount} pages` },
    { label: 'Tone', value: state.tone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step7.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step7.description', 'Review your report settings and click Generate to start')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            {t('wizard.step7.summary', 'Report Configuration')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryItems.map((item) => (
              <div key={item.label}>
                <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                <p className="font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {state.mainProblem && (
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2 font-medium">Business Problem:</p>
            <p className="text-slate-900">{state.mainProblem}</p>
          </div>
        )}

        {state.sections.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-3 font-medium">Included Sections:</p>
            <div className="flex flex-wrap gap-2">
              {state.sections.map((section) => (
                <span
                  key={section}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-900"
                >
                  {getSectionLabel(section)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            {t(
              'wizard.step7.info',
              'Your report generation typically takes 2-5 minutes. You will receive an email notification when it is complete.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
