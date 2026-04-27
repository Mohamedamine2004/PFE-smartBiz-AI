import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, Landmark } from 'lucide-react';
import { ReportAudience } from '../../../types/report';
import type { WizardStepProps } from '../types';

const AUDIENCES = [
  {
    value: ReportAudience.INTERNAL,
    icon: Users,
    gradient: 'from-slate-700 to-slate-800',
    description: 'wizard.step2new.audiences.INTERNAL.desc',
    focusLabel: 'wizard.step2new.audiences.INTERNAL.focus',
  },
  {
    value: ReportAudience.INVESTORS,
    icon: TrendingUp,
    gradient: 'from-blue-600 to-indigo-700',
    description: 'wizard.step2new.audiences.INVESTORS.desc',
    focusLabel: 'wizard.step2new.audiences.INVESTORS.focus',
  },
  {
    value: ReportAudience.BANK,
    icon: Landmark,
    gradient: 'from-emerald-600 to-teal-700',
    description: 'wizard.step2new.audiences.BANK.desc',
    focusLabel: 'wizard.step2new.audiences.BANK.focus',
  },
];

const DEFAULT_DESCS: Record<string, string> = {
  INTERNAL: 'Team & management — performance, costs & operations focus.',
  INVESTORS: 'Investors & board — growth, valuation & market opportunity focus.',
  BANK: 'Credit institutions — solvency, debt ratios & repayment capacity focus.',
};

const DEFAULT_FOCUS: Record<string, string> = {
  INTERNAL: 'Operational • Costs • Headcount',
  INVESTORS: 'Growth • Revenue • Market',
  BANK: 'Debt ratio • Cash flow • Assets',
};

export const Step2Audience = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t('wizard.step2new.title', 'Who will read this report?')}
      </h2>
      <p className="text-slate-500 mb-6">
        {t('wizard.step2new.subtitle', 'The audience shapes the language, tone, and focus of your report automatically.')}
      </p>

      <div className="flex flex-col gap-4">
        {AUDIENCES.map(({ value, icon: Icon, gradient, description, focusLabel }) => {
          const isActive = state.audience === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, audience: value })}
              className={`relative overflow-hidden flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${isActive
                  ? 'border-transparent shadow-xl scale-[1.01]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
            >
              {/* Gradient background when active */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`} />
              )}

              <div
                className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-100'
                  }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              </div>

              <div className="relative flex-1">
                <p className={`font-bold text-base ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {t(`wizard.step2new.audiences.${value}.label`, value)}
                </p>
                <p className={`text-sm mt-1 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {t(description, DEFAULT_DESCS[value])}
                </p>
                <div className={`mt-2 flex gap-1 flex-wrap`}>
                  {(t(focusLabel, DEFAULT_FOCUS[value]) as string)
                    .split('•')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              {isActive && (
                <div className="relative ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {errors.audience && (
        <p className="mt-3 text-sm text-red-600">{errors.audience}</p>
      )}
    </div>
  );
};
