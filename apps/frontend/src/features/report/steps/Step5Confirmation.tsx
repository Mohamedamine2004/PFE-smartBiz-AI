import { useTranslation } from 'react-i18next';
import {
  FileText,
  Users,
  Globe,
  FileBarChart,
  MessageSquare,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { WizardStepProps } from '../types';

const AUDIENCE_LABELS: Record<string, string> = {
  INTERNAL: 'Internal Team',
  INVESTORS: 'Investors / Board',
  BANK: 'Bank / Credit',
};

const LENGTH_LABELS: Record<string, { label: string; pages: string }> = {
  SHORT: { label: 'Short', pages: '~5 pages' },
  MEDIUM: { label: 'Medium', pages: '~10 pages' },
  LONG: { label: 'Long', pages: '~18 pages' },
};

const LANG_LABELS: Record<string, string> = {
  FR: '🇫🇷 Français',
  EN: '🇬🇧 English',
  AR: '🇸🇦 العربية',
};

export const Step5Confirmation = ({ state }: WizardStepProps) => {
  const { t } = useTranslation();
  const length = LENGTH_LABELS[state.lengthProfile] ?? { label: state.lengthProfile, pages: '' };

  const summaryItems = [
    {
      icon: FileBarChart,
      label: t('wizard.confirmation.type', 'Analysis Type'),
      value: state.reportType.replace(/_/g, ' '),
    },
    {
      icon: Users,
      label: t('wizard.confirmation.audience', 'Audience'),
      value: AUDIENCE_LABELS[state.audience] ?? state.audience,
    },
    {
      icon: Globe,
      label: t('wizard.confirmation.language', 'Language'),
      value: LANG_LABELS[state.language] ?? state.language,
    },
    {
      icon: FileText,
      label: t('wizard.confirmation.length', 'Report Length'),
      value: `${length.label} — ${length.pages}`,
    },
  ];

  const autoFeatures = [
    t('wizard.confirmation.features.benchmark', '✦ Automatic sector benchmark'),
    t('wizard.confirmation.features.charts', '✦ Native PDF charts & tables'),
    t('wizard.confirmation.features.toc', '✦ Cover page + Table of Contents'),
    t('wizard.confirmation.features.branding', '✦ Company branding applied'),
    t('wizard.confirmation.features.headers', '✦ Headers, footers & pagination'),
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t('wizard.confirmation.title', 'Ready to generate!')}
      </h2>
      <p className="text-slate-500 mb-6">
        {t('wizard.confirmation.subtitle', "Review your choices — the AI will craft your report based on your company's real financial data.")}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {summaryItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-900 capitalize mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Problem Statement Preview */}
      {state.problemStatement?.trim() && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              {t('wizard.confirmation.problem', 'Business Context')}
            </p>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed line-clamp-3">
            {state.problemStatement}
          </p>
        </div>
      )}

      {/* Auto Features */}
      <div className="p-4 rounded-xl bg-blue-600 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-300" />
          <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
            {t('wizard.confirmation.auto', 'Automatically included')}
          </p>
        </div>
        <ul className="space-y-1.5">
          {autoFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
