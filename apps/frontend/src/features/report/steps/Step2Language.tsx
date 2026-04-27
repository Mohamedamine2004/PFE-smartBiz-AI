import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportLanguage } from '../../../types/report';

const LANGUAGES = [
  { value: ReportLanguage.EN, label: 'English', icon: '🇬🇧' },
  { value: ReportLanguage.FR, label: 'Français', icon: '🇫🇷' },
  { value: ReportLanguage.AR, label: 'العربية', icon: '🇸🇦' },
] as const;

export const Step2Language = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleSelect = (lang: ReportLanguage) => {
    setState({ ...state, language: lang });
    setErrors({ ...errors, language: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step2.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step2.description', 'Choose the language for your report')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleSelect(lang.value)}
            className={`p-6 rounded-lg border-2 transition-all ${state.language === lang.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div className="text-3xl mb-2">{lang.icon}</div>
            <h3 className="font-semibold text-slate-900">{lang.label}</h3>
          </button>
        ))}
      </div>

      {errors.language && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.language}</div>
      )}
    </div>
  );
};
