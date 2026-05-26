import { useTranslation } from 'react-i18next';
import { Lightbulb, ArrowRight } from 'lucide-react';
import type { WizardStepProps } from '../types';

const MAX_CHARS = 2000;

const EXAMPLES = [
  'Notre taux de churn est élevé, nous souhaitons identifier les causes racines.',
  'Nous cherchons à lever une Série A et avons besoin d\'une analyse prête pour les investisseurs.',
  'Nos coûts opérationnels ont augmenté de 30% ce trimestre sans croissance du chiffre d\'affaires.',
];

export const Step4ProblemStatement = ({ state, setState, errors }: WizardStepProps) => {
  const { t } = useTranslation();
  const charCount = state.problemStatement.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 7 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.step4.title', 'Quel est votre enjeu principal ?')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.step4.subtitle', 'Ce contexte guide l\'analyse IA. Plus de détails = de meilleurs insights. (Optionnel mais recommandé)')}
      </p>

      {/* Textarea */}
      <div className="relative mb-3">
        <textarea
          value={state.problemStatement}
          onChange={(e) => setState({ ...state, problemStatement: e.target.value.slice(0, MAX_CHARS) })}
          placeholder={t('wizard.step4.placeholder', 'Décrivez votre problématique, objectif stratégique ou les questions clés...')}
          rows={6}
          className="w-full px-4 py-3 text-sm rounded-xl outline-none resize-none transition-all duration-200 text-text-main placeholder:text-text-muted"
          style={{
            background: 'var(--bg-elevated)',
            border: `1.5px solid ${errors.problemStatement ? 'var(--error)' : 'var(--border-color)'}`,
            boxShadow: errors.problemStatement
              ? '0 0 0 3px color-mix(in srgb, var(--error) 15%, transparent)'
              : undefined,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,209,255,0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,209,255,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.problemStatement ? 'var(--error)' : 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div
          className={`absolute bottom-3 right-3 text-[10px] font-mono transition-colors ${isNearLimit ? 'text-warning' : 'text-text-muted/50'}`}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {errors.problemStatement && (
        <p className="mb-4 text-sm text-error">{errors.problemStatement}</p>
      )}

      {/* Example prompts */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgba(0,209,255,0.04)',
          border: '1px solid rgba(0,209,255,0.12)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-brand" />
          <p className="text-[11px] font-bold text-brand uppercase tracking-widest">
            {t('wizard.step4.examples.title', 'Exemples de contexte')}
          </p>
        </div>
        <div className="space-y-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setState({ ...state, problemStatement: example })}
              className="w-full text-left text-xs text-text-muted hover:text-text-main flex items-start gap-2 px-3 py-2 rounded-lg transition-colors duration-150"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
              }}
            >
              <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-brand" />
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
