import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Megaphone, Settings, DollarSign, CheckCircle2 } from 'lucide-react';
import { ReportType } from '../../../types/report';
import type { WizardStepProps } from '../types';

const REPORT_TYPES = [
  { value: ReportType.FINANCIAL,   icon: BarChart3,  accent: '#00d1ff', glow: 'rgba(0,209,255,0.08)', borderGlow: 'rgba(0,209,255,0.25)', desc: 'wizard.step1.types.FINANCIAL.desc', defDesc: 'Bilan de santé financière, marges, BFR & rentabilité.' },
  { value: ReportType.STRATEGIC,   icon: TrendingUp, accent: '#6366f1', glow: 'rgba(99,102,241,0.08)', borderGlow: 'rgba(99,102,241,0.25)', desc: 'wizard.step1.types.STRATEGIC.desc', defDesc: 'Positionnement concurrentiel, SWOT & leviers de croissance.' },
  { value: ReportType.MARKETING,   icon: Megaphone,  accent: '#f43f5e', glow: 'rgba(244,63,94,0.08)', borderGlow: 'rgba(244,63,94,0.25)', desc: 'wizard.step1.types.MARKETING.desc', defDesc: 'Stratégie d\'acquisition, entonnoir de conversion & ROI.' },
  { value: ReportType.OPERATIONAL, icon: Settings,   accent: '#fb923c', glow: 'rgba(251,146,96,0.08)', borderGlow: 'rgba(251,146,96,0.25)', desc: 'wizard.step1.types.OPERATIONAL.desc', defDesc: 'Optimisation des flux de travail, goulots & productivité.' },
  { value: ReportType.VALUATION,   icon: DollarSign, accent: '#10b981', glow: 'rgba(16,185,129,0.08)', borderGlow: 'rgba(16,185,129,0.25)', desc: 'wizard.step1.types.VALUATION.desc', defDesc: 'Multiples d\'EBITDA, DCF & valorisation de marché.' },
];

export const Step1ReportType = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1 font-mono">
          {t('wizard.step', 'Étape')} 1 / 8
        </p>
        <h2 className="text-xl font-bold text-text-main">
          {t('wizard.step1.title', 'Quel type de rapport souhaitez-vous ?')}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {t('wizard.step1.subtitle', 'Sélectionnez le focus principal de votre analyse.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {REPORT_TYPES.map(({ value, icon: Icon, accent, glow, borderGlow, desc, defDesc }, idx) => {
          const isActive = state.reportType === value;
          const isLarge = idx === 0; // Financial has priority, make it span full-width
          
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, reportType: value })}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl text-left transition-all duration-300 border hover:-translate-y-1 hover:shadow-xl ${
                isActive 
                  ? 'shadow-lg font-semibold' 
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              } ${isLarge ? 'md:col-span-2' : ''}`}
              style={{
                background: isActive ? `color-mix(in srgb, ${accent} 8%, var(--bg-elevated))` : 'var(--bg-elevated)',
                borderColor: isActive ? accent : 'var(--border-color)',
                boxShadow: isActive ? `0 8px 24px ${borderGlow}` : 'none',
              }}
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: isActive ? `color-mix(in srgb, ${accent} 16%, var(--bg-elevated))` : 'var(--bg-surface)',
                    border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                    boxShadow: isActive ? `0 0 15px ${borderGlow}` : 'none',
                  }}
                >
                  <Icon
                    className="w-5 h-5 transition-colors duration-200"
                    style={{ color: isActive ? accent : 'var(--text-secondary)' }}
                  />
                </div>
                {isActive && (
                  <CheckCircle2
                    className="w-5 h-5 shrink-0 animate-scale-up"
                    style={{ color: accent }}
                  />
                )}
              </div>

              <div className="mt-4">
                <p
                  className="font-bold text-sm text-text-main transition-colors group-hover:text-brand"
                >
                  {t(`wizard.step1.types.${value}.label`, value)}
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {t(desc, defDesc)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {errors.reportType && (
        <p className="mt-3 text-xs text-red-500 font-semibold">{errors.reportType}</p>
      )}
    </div>
  );
};
