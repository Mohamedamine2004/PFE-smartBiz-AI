import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { WizardStepProps } from '../types';
import { ReportSection } from '../../../types/report';

const SECTIONS = [
  { value: ReportSection.EXECUTIVE_SUMMARY,   label: 'wizard.step5.sections.executiveSummary.label', desc: 'wizard.step5.sections.executiveSummary.desc' },
  { value: ReportSection.SWOT_ANALYSIS,       label: 'wizard.step5.sections.swot.label',             desc: 'wizard.step5.sections.swot.desc' },
  { value: ReportSection.PERFORMANCE_ANALYSIS,label: 'wizard.step5.sections.performance.label',      desc: 'wizard.step5.sections.performance.desc' },
  { value: ReportSection.FINANCIAL_OVERVIEW,  label: 'wizard.step5.sections.financialOverview.label',desc: 'wizard.step5.sections.financialOverview.desc' },
  { value: ReportSection.RECOMMENDATIONS,     label: 'wizard.step5.sections.recommendations.label',  desc: 'wizard.step5.sections.recommendations.desc' },
  { value: ReportSection.FORECASTS_TRENDS,    label: 'wizard.step5.sections.forecasts.label',        desc: 'wizard.step5.sections.forecasts.desc' },
] as const;

export const Step5Sections = ({ state, setState, errors, setErrors }: WizardStepProps) => {
  const { t } = useTranslation();

  const toggleSection = (section: ReportSection) => {
    const newSections = state.sections.includes(section)
      ? state.sections.filter((s) => s !== section)
      : [...state.sections, section];
    setState({ ...state, sections: newSections });
    setErrors({ ...errors, sections: '' });
  };

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 5 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.step5.title', 'Sections à inclure')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.step5.description', 'Laissez vide pour générer automatiquement toutes les sections recommandées.')}
      </p>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isSelected = state.sections.includes(section.value);
          return (
            <button
              key={section.value}
              onClick={() => toggleSection(section.value)}
              className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: isSelected ? 'color-mix(in srgb, var(--brand) 8%, var(--bg-elevated))' : 'var(--bg-elevated)',
                border: `1.5px solid ${isSelected ? 'var(--brand)' : 'var(--border-color)'}`,
              }}
            >
              {/* Custom checkbox */}
              <div
                className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  background: isSelected ? 'var(--brand)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--brand)' : 'var(--border-color)'}`,
                  boxShadow: isSelected ? '0 0 8px rgba(0,209,255,0.4)' : 'none',
                }}
              >
                {isSelected && <Check className="w-3 h-3 text-background" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-text-main">{t(section.label)}</h3>
                <p className="text-xs text-text-muted mt-0.5">{t(section.desc)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {errors.sections && (
        <div
          className="mt-3 rounded-lg p-3 text-sm text-error"
          style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}
        >
          {errors.sections}
        </div>
      )}

      <div
        className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl text-xs"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
      >
        <span className="text-text-muted">{t('wizard.step5.selected', 'Sections sélectionnées')}</span>
        <span
          className="font-bold px-2 py-0.5 rounded-full text-brand"
          style={{ background: 'rgba(0,209,255,0.1)' }}
        >
          {state.sections.length === 0 ? 'Auto' : state.sections.length}
        </span>
      </div>
    </div>
  );
};
