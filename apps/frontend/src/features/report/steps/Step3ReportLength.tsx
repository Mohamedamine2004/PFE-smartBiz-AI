import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportLengthProfile } from '../../../types/report';
import { CheckCircle2, Zap, BarChart2, BookOpen } from 'lucide-react';

const LENGTH_OPTIONS = [
  {
    value: ReportLengthProfile.SHORT,
    pages: '~5',
    icon: Zap,
    accent: 'rgba(0,209,255,0.9)',
    glow: 'rgba(0,209,255,0.12)',
    sections: ['wizard.sections.cover', 'wizard.sections.summary', 'wizard.sections.oneAnalysis', 'wizard.sections.recommendations'],
  },
  {
    value: ReportLengthProfile.MEDIUM,
    pages: '~10',
    icon: BarChart2,
    accent: 'rgba(99,102,241,0.9)',
    glow: 'rgba(99,102,241,0.12)',
    sections: ['wizard.sections.cover', 'wizard.sections.toc', 'wizard.sections.summary', 'wizard.sections.threeAnalyses', 'wizard.sections.benchmark', 'wizard.sections.recommendations'],
  },
  {
    value: ReportLengthProfile.LONG,
    pages: '~18',
    icon: BookOpen,
    accent: 'rgba(16,185,129,0.9)',
    glow: 'rgba(16,185,129,0.12)',
    sections: ['wizard.sections.cover', 'wizard.sections.toc', 'wizard.sections.summary', 'wizard.sections.allAnalyses', 'wizard.sections.benchmark', 'wizard.sections.forecasts', 'wizard.sections.appendices'],
  },
] as const;

export const Step3ReportLength = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 4 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.step3.title', 'Quelle profondeur d\'analyse ?')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.step3.subtitle', 'Chaque profil garantit un nombre fixe de pages avec un contenu structuré.')}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {LENGTH_OPTIONS.map(({ value, pages, icon: Icon, accent, glow, sections }) => {
          const isActive = state.lengthProfile === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState({ ...state, lengthProfile: value })}
              className="flex items-center gap-5 p-5 rounded-xl text-left transition-all duration-200"
              style={{
                background: isActive ? glow : 'var(--bg-elevated)',
                border: `1.5px solid ${isActive ? accent.replace('0.9)', '0.35)') : 'var(--border-color)'}`,
                boxShadow: isActive ? `0 4px 24px ${glow}` : 'none',
              }}
            >
              {/* Icon + pages */}
              <div
                className="shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5"
                style={{
                  background: isActive ? glow : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? accent.replace('0.9)', '0.25)') : 'var(--border-color)'}`,
                  boxShadow: isActive ? `0 0 16px ${glow}` : 'none',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? accent : 'var(--text-secondary)' }} />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? accent : 'var(--text-secondary)' }}
                >
                  {pages}p
                </span>
              </div>

              {/* Label + tags */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-text-main">
                  {t(`wizard.step3.profiles.${value}.label`, value)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t(`wizard.step3.profiles.${value}.desc`, `${pages} pages`)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sections.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: isActive ? accent.replace('0.9)', '0.12)') : 'var(--bg-surface)',
                        color: isActive ? accent : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? accent.replace('0.9)', '0.18)') : 'var(--border-color)'}`,
                      }}
                    >
                      {t(s)}
                    </span>
                  ))}
                </div>
              </div>

              {isActive && (
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: accent }} />
              )}
            </button>
          );
        })}
      </div>

      {errors.lengthProfile && (
        <p className="mt-3 text-sm text-error">{errors.lengthProfile}</p>
      )}
    </div>
  );
};
