import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Megaphone, Settings, DollarSign } from 'lucide-react';
import { ReportType } from '../../../types/report';
import type { WizardStepProps } from '../types';

const REPORT_TYPES = [
  {
    value: ReportType.FINANCIAL,
    icon: BarChart3,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    activeBg: 'bg-blue-600',
  },
  {
    value: ReportType.STRATEGIC,
    icon: TrendingUp,
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    activeBg: 'bg-purple-600',
  },
  {
    value: ReportType.MARKETING,
    icon: Megaphone,
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50 border-pink-200',
    activeBg: 'bg-pink-600',
  },
  {
    value: ReportType.OPERATIONAL,
    icon: Settings,
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 border-orange-200',
    activeBg: 'bg-orange-500',
  },
  {
    value: ReportType.VALUATION,
    icon: DollarSign,
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 border-emerald-200',
    activeBg: 'bg-emerald-600',
  },
];

export const Step1ReportType = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t('wizard.step1.title', 'What type of report do you need?')}
      </h2>
      <p className="text-slate-500 mb-6">
        {t('wizard.step1.subtitle', 'Select the primary analysis focus for this report.')}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {REPORT_TYPES.map(({ value, icon: Icon, bg, activeBg }) => {
          const isActive = state.reportType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, reportType: value })}
              className={`group flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${isActive
                  ? `border-blue-500 bg-blue-50 shadow-md shadow-blue-100`
                  : `border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm`
                }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? activeBg : bg
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                  {t(`wizard.step1.types.${value}.label`, value)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(`wizard.step1.types.${value}.desc`, '')}
                </p>
              </div>
              {isActive && (
                <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {errors.reportType && (
        <p className="mt-3 text-sm text-red-600">{errors.reportType}</p>
      )}
    </div>
  );
};
