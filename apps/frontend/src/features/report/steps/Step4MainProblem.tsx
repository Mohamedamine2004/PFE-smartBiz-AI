import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import type { WizardStepProps } from '../types';

const MAX_CHARS = 2000;

const EXAMPLES = [
  'Our churn rate is high and we need to identify the root causes.',
  'We are looking to raise a Series A and need an investor-ready analysis.',
  'Our operational costs increased by 30% this quarter with no revenue growth.',
];

export const Step4ProblemStatement = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();
  const charCount = state.problemStatement.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t('wizard.step4.title', "What's your main business challenge?")}
      </h2>
      <p className="text-slate-500 mb-6">
        {t('wizard.step4.subtitle', 'This context shapes the AI analysis. More detail = better insights. (Optional but recommended)')}
      </p>

      <div className="relative mb-3">
        <textarea
          value={state.problemStatement}
          onChange={(e) =>
            setState({ ...state, problemStatement: e.target.value.slice(0, MAX_CHARS) })
          }
          placeholder={t(
            'wizard.step4.placeholder',
            'Describe your main business problem, strategic goal, or key questions you want the report to address...',
          )}
          rows={6}
          className={`w-full px-4 py-3 text-sm rounded-xl border-2 outline-none resize-none transition-colors bg-white ${errors.problemStatement
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-200 focus:border-blue-400'
            } text-slate-900 placeholder:text-slate-400`}
        />
        <div
          className={`absolute bottom-3 right-3 text-xs font-mono ${isNearLimit ? 'text-orange-500' : 'text-slate-400'
            }`}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {errors.problemStatement && (
        <p className="mb-4 text-sm text-red-600">{errors.problemStatement}</p>
      )}

      {/* Example prompts */}
      <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            {t('wizard.step4.examples.title', 'Example prompts')}
          </p>
        </div>
        <div className="space-y-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setState({ ...state, problemStatement: example })}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
            >
              → {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
