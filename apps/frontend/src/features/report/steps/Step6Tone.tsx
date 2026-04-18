import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';
import { ReportTone } from '../../../types/report';

const TONES = [
  { value: ReportTone.PROFESSIONAL, label: 'Professional', desc: 'Formal and structured' },
  { value: ReportTone.ANALYTICAL, label: 'Analytical', desc: 'Data-driven and detailed' },
  { value: ReportTone.EXECUTIVE, label: 'Executive', desc: 'Concise and decision-focused' },
  { value: ReportTone.CONSULTATIVE, label: 'Consultative', desc: 'Collaborative and advisory' },
] as const;

export const Step6Tone = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleSelect = (tone: ReportTone) => {
    setState({ ...state, tone });
    setErrors({ ...errors, tone: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step6.title')}</h2>
        <p className="text-slate-600">
          {t('wizard.step6.description', 'Select the tone and style for your report')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TONES.map((toneOption) => (
          <button
            key={toneOption.value}
            onClick={() => handleSelect(toneOption.value)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              state.tone === toneOption.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <h3 className="font-semibold text-slate-900 mb-1">{toneOption.label}</h3>
            <p className="text-sm text-slate-600">{toneOption.desc}</p>
          </button>
        ))}
      </div>

      {errors.tone && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.tone}</div>
      )}
    </div>
  );
};
