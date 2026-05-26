import { useTranslation } from 'react-i18next';
import {
  FileText, Users, Globe, FileBarChart, MessageSquare, CheckCircle2, Zap,
} from 'lucide-react';
import type { WizardStepProps } from '../types';

const AUDIENCE_LABELS: Record<string, string> = {
  INTERNAL: 'wizard.confirmation.audiences.internal',
  INVESTORS: 'wizard.confirmation.audiences.investors',
  BANK: 'wizard.confirmation.audiences.bank',
};

const LENGTH_LABELS: Record<string, { label: string; pages: string }> = {
  SHORT:  { label: 'wizard.confirmation.lengths.short.label',  pages: 'wizard.confirmation.lengths.short.pages' },
  MEDIUM: { label: 'wizard.confirmation.lengths.medium.label', pages: 'wizard.confirmation.lengths.medium.pages' },
  LONG:   { label: 'wizard.confirmation.lengths.long.label',   pages: 'wizard.confirmation.lengths.long.pages' },
};

const LANG_LABELS: Record<string, string> = {
  FR: 'FR — Français',
  EN: 'EN — English',
  AR: 'AR — العربية',
};

export const Step5Confirmation = ({ state }: WizardStepProps) => {
  const { t } = useTranslation();
  const length = LENGTH_LABELS[state.lengthProfile] ?? { label: state.lengthProfile, pages: '' };

  const summaryItems = [
    {
      icon: FileBarChart,
      label: t('wizard.confirmation.type', 'Type d\'analyse'),
      value: state.reportType.replace(/_/g, ' '),
      accent: 'rgba(0,209,255,0.9)',
      glow: 'rgba(0,209,255,0.1)',
    },
    {
      icon: Users,
      label: t('wizard.confirmation.audience', 'Audience'),
      value: t(AUDIENCE_LABELS[state.audience] ?? state.audience),
      accent: 'rgba(99,102,241,0.9)',
      glow: 'rgba(99,102,241,0.1)',
    },
    {
      icon: Globe,
      label: t('wizard.confirmation.language', 'Langue'),
      value: LANG_LABELS[state.language] ?? state.language,
      accent: 'rgba(16,185,129,0.9)',
      glow: 'rgba(16,185,129,0.1)',
    },
    {
      icon: FileText,
      label: t('wizard.confirmation.length', 'Longueur'),
      value: `${t(length.label)} — ${t(length.pages)}`,
      accent: 'rgba(251,146,60,0.9)',
      glow: 'rgba(251,146,60,0.1)',
    },
  ];

  const autoFeatures = [
    t('wizard.confirmation.features.benchmark', 'Benchmark sectoriel automatique'),
    t('wizard.confirmation.features.charts', 'Graphiques & tableaux natifs PDF'),
    t('wizard.confirmation.features.toc', 'Page de couverture + Table des matières'),
    t('wizard.confirmation.features.branding', 'Branding de l\'entreprise appliqué'),
    t('wizard.confirmation.features.headers', 'En-têtes, pieds de page & pagination'),
  ];

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 8 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.confirmation.title', 'Prêt à générer !')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.confirmation.subtitle', "Vérifiez vos choix — l'IA rédigera votre rapport à partir des données financières réelles de votre entreprise.")}
      </p>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {summaryItems.map(({ icon: Icon, label, value, accent, glow }) => (
          <div
            key={label}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: glow, border: `1px solid ${accent.replace('0.9)', '0.2)')}` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: accent.replace('0.9)', '0.15)') }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
              <p className="text-xs font-semibold text-text-main capitalize mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Problem Statement */}
      {state.problemStatement?.trim() && (
        <div
          className="mb-4 p-4 rounded-xl"
          style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4" style={{ color: 'rgba(251,146,60,0.9)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(251,146,60,0.9)' }}>
              {t('wizard.confirmation.problem', 'Contexte business')}
            </p>
          </div>
          <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
            {state.problemStatement}
          </p>
        </div>
      )}

      {/* Auto features */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(0,209,255,0.07), rgba(99,102,241,0.05))',
          border: '1px solid rgba(0,209,255,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-brand" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
            {t('wizard.confirmation.auto', 'Inclus automatiquement')}
          </p>
        </div>
        <ul className="space-y-2">
          {autoFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="text-xs text-text-muted">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
