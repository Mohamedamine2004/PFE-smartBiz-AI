import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportLanguage } from '../../../types/report';
import { CheckCircle2 } from 'lucide-react';

const LANGUAGES = [
  { value: ReportLanguage.EN, label: 'English',   code: 'EN', accent: 'rgba(0,209,255,0.9)',  glow: 'rgba(0,209,255,0.12)'  },
  { value: ReportLanguage.FR, label: 'Français',  code: 'FR', accent: 'rgba(99,102,241,0.9)', glow: 'rgba(99,102,241,0.12)' },
  { value: ReportLanguage.AR, label: 'العربية',   code: 'AR', accent: 'rgba(16,185,129,0.9)', glow: 'rgba(16,185,129,0.12)' },
] as const;

export const Step2Language = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleSelect = (lang: ReportLanguage) => {
    setState({ ...state, language: lang });
    setErrors({ ...errors, language: '' });
  };

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 3 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.step2.title', 'Langue du rapport')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.step2.description', 'Choisissez la langue de rédaction de votre rapport.')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => {
          const isActive = state.language === lang.value;
          return (
            <button
              key={lang.value}
              onClick={() => handleSelect(lang.value)}
              className="relative flex flex-col items-center gap-3 p-6 rounded-xl transition-all duration-200"
              style={{
                background: isActive ? `color-mix(in srgb, ${lang.accent} 8%, var(--bg-elevated))` : 'var(--bg-elevated)',
                border: `1.5px solid ${isActive ? lang.accent : 'var(--border-color)'}`,
                boxShadow: isActive ? `0 8px 24px ${lang.glow}` : 'none',
              }}
            >
              {/* Language code badge */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive ? `color-mix(in srgb, ${lang.accent} 16%, var(--bg-elevated))` : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? lang.accent : 'var(--border-color)'}`,
                  boxShadow: isActive ? `0 0 16px ${lang.glow}` : 'none',
                }}
              >
                <span
                  className="text-xl font-black tracking-tight"
                  style={{ color: isActive ? lang.accent : 'var(--text-secondary)' }}
                >
                  {lang.code}
                </span>
              </div>

              <span
                className="font-semibold text-sm transition-colors"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {lang.label}
              </span>

              {isActive && (
                <CheckCircle2
                  className="absolute top-3 right-3 w-4 h-4"
                  style={{ color: lang.accent }}
                />
              )}
            </button>
          );
        })}
      </div>

      {errors.language && (
        <div className="mt-4 rounded-lg p-3 text-sm text-error"
          style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
          {errors.language}
        </div>
      )}
    </div>
  );
};
