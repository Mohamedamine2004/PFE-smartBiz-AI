import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, Landmark, CheckCircle2 } from 'lucide-react';
import { ReportAudience } from '../../../types/report';
import type { WizardStepProps } from '../types';

const AUDIENCES = [
  {
    value: ReportAudience.INTERNAL,
    icon: Users,
    accent: '#00d1ff',
    glow: 'rgba(0,209,255,0.08)',
    borderGlow: 'rgba(0,209,255,0.25)',
    description: 'wizard.step2new.audiences.INTERNAL.desc',
    focusLabel: 'wizard.step2new.audiences.INTERNAL.focus',
    defaultDesc: 'Équipe & management — performance, coûts & opérations.',
    defaultFocus: 'Opérationnel • Coûts • Effectifs',
  },
  {
    value: ReportAudience.INVESTORS,
    icon: TrendingUp,
    accent: '#6366f1',
    glow: 'rgba(99,102,241,0.08)',
    borderGlow: 'rgba(99,102,241,0.25)',
    description: 'wizard.step2new.audiences.INVESTORS.desc',
    focusLabel: 'wizard.step2new.audiences.INVESTORS.focus',
    defaultDesc: 'Investisseurs & conseil — croissance, valorisation & marché.',
    defaultFocus: 'Croissance • Revenus • Marché',
  },
  {
    value: ReportAudience.BANK,
    icon: Landmark,
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.08)',
    borderGlow: 'rgba(16,185,129,0.25)',
    description: 'wizard.step2new.audiences.BANK.desc',
    focusLabel: 'wizard.step2new.audiences.BANK.focus',
    defaultDesc: 'Établissements de crédit — solvabilité, ratios & remboursement.',
    defaultFocus: 'Ratio dette • Cash-flow • Actifs',
  },
];

export const Step2Audience = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1 font-mono">
          {t('wizard.step', 'Étape')} 2 / 8
        </p>
        <h2 className="text-xl font-bold text-text-main">
          {t('wizard.step2new.title', 'Qui lira ce rapport ?')}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {t('wizard.step2new.subtitle', "L'audience définit automatiquement le langage, le ton et le focus.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {AUDIENCES.map(({ value, icon: Icon, accent, glow, borderGlow, description, focusLabel, defaultDesc, defaultFocus }) => {
          const isActive = state.audience === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, audience: value })}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl text-left transition-all duration-300 border hover:-translate-y-1 hover:shadow-xl ${
                isActive 
                  ? 'border-brand/40 shadow-lg' 
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25'
              }`}
              style={{
                background: isActive ? glow : 'var(--bg-elevated)',
                boxShadow: isActive ? `0 10px 30px ${glow}` : 'none',
              }}
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: isActive ? 'white' : 'var(--bg-surface)',
                    border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                    boxShadow: isActive ? `0 0 15px ${borderGlow}` : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? accent : 'var(--text-secondary)' }} />
                </div>
                {isActive && (
                  <CheckCircle2 className="w-5 h-5 shrink-0 animate-scale-up" style={{ color: accent }} />
                )}
              </div>

              <div className="mt-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-sm text-text-main group-hover:text-brand transition-colors">
                    {t(`wizard.step2new.audiences.${value}.label`, value)}
                  </p>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                    {t(description, defaultDesc)}
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex gap-1 flex-wrap">
                  {(t(focusLabel, defaultFocus) as string)
                    .split('•')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono"
                        style={{
                          background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface)',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.15)' : 'var(--border-color)'}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errors.audience && (
        <p className="mt-3 text-xs text-red-500 font-semibold">{errors.audience}</p>
      )}
    </div>
  );
};
