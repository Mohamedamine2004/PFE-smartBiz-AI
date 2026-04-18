import { useTranslation } from 'react-i18next';
import type { WizardStepProps } from '../types';

export const Step4MainProblem = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    setState({ ...state, mainProblem: value });
    setErrors({ ...errors, mainProblem: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step4.title')}</h2>
        <p className="text-slate-600">
          {t(
            'wizard.step4.description',
            'Describe the main business problem or focus area for this report',
          )}
        </p>
      </div>

      <div>
        <label htmlFor="problem-statement" className="block text-sm font-medium text-slate-900 mb-2">
          {t('wizard.step4.label', 'Business Problem / Focus Area')}
        </label>
        <textarea
          id="problem-statement"
          value={state.mainProblem}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t(
            'wizard.step4.placeholder',
            'E.g., We need to optimize our customer acquisition costs while maintaining quality...',
          )}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder-slate-500"
        />
        <div className="mt-2 text-sm text-slate-500">
          {state.mainProblem.length}/2000 {t('wizard.characters', 'characters')}
        </div>
      </div>

      {errors.mainProblem && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.mainProblem}</div>
      )}

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">{t('wizard.step4.tip', 'Tip:')}</p>
        <p>
          {t(
            'wizard.step4.tipText',
            'The more specific you are about your business challenge, the more tailored and relevant your report will be.',
          )}
        </p>
      </div>
    </div>
  );
};
