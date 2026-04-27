import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportLengthProfile } from '../../../types/report';

const LENGTH_OPTIONS = [
  {
    value: ReportLengthProfile.SHORT,
    pages: '~5',
    icon: '⚡',
    color: 'from-sky-400 to-blue-500',
    sections: ['Cover', 'Executive Summary', '1 Analysis', 'Recommendations'],
  },
  {
    value: ReportLengthProfile.MEDIUM,
    pages: '~10',
    icon: '📊',
    color: 'from-blue-500 to-indigo-600',
    sections: ['Cover', 'TOC', 'Executive Summary', '3 Analyses', 'Benchmark', 'Recommendations'],
  },
  {
    value: ReportLengthProfile.LONG,
    pages: '~18',
    icon: '📚',
    color: 'from-indigo-600 to-purple-700',
    sections: ['Cover', 'TOC', 'Executive Summary', 'All Analyses', 'Benchmark', 'Forecasts', 'Annexes'],
  },
] as const;

export const Step3ReportLength = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t('wizard.step3.title', 'How detailed should the report be?')}
      </h2>
      <p className="text-slate-500 mb-6">
        {t('wizard.step3.subtitle', 'Each profile guarantees a fixed number of pages with structured content.')}
      </p>

      <div className="grid grid-cols-1 gap-4">
        {LENGTH_OPTIONS.map(({ value, pages, icon, color, sections }) => {
          const isActive = state.lengthProfile === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, lengthProfile: value })}
              className={`group relative overflow-hidden flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${isActive
                  ? 'border-transparent shadow-xl'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
            >
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
              )}

              <div
                className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-100'
                  }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className={`text-xs font-bold mt-0.5 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {pages}p
                </span>
              </div>

              <div className="relative flex-1">
                <p className={`font-bold text-base ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {t(`wizard.step3.profiles.${value}.label`, value)}
                </p>
                <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {t(`wizard.step3.profiles.${value}.desc`, `~${pages} pages`)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sections.map((s) => (
                    <span
                      key={s}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {isActive && (
                <div className="relative flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {errors.lengthProfile && (
        <p className="mt-3 text-sm text-red-600">{errors.lengthProfile}</p>
      )}
    </div>
  );
};
