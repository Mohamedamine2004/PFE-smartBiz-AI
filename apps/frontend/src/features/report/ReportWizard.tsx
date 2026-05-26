import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Users,
  Globe,
  AlignJustify,
  Layers,
  Palette,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { reportApi } from '../../lib/reportApi';
import {
  ReportLanguage as RL,
  ReportLengthProfile as RLP,
  ReportAudience as RA,
} from '../../types/report';
import { Step1ReportType } from './steps/Step1ReportType';
import { Step2Audience } from './steps/Step2Audience';
import { Step2Language } from './steps/Step2Language';
import { Step3ReportLength } from './steps/Step3ReportLength';
import { Step5Sections } from './steps/Step5Sections';
import { Step6Customization } from './steps/Step6Customization';
import { Step4ProblemStatement } from './steps/Step4MainProblem';
import { Step5Confirmation } from './steps/Step5Confirmation';
import type { WizardFormState } from './types';
import { ReportProgress } from './ReportProgress';

interface ReportWizardProps {
  onSuccess?: (reportId: string) => void;
}

const STEPS = [
  { key: 'wizard.steps.type',          icon: BarChart3,      labelKey: 'wizard.steps.type' },
  { key: 'wizard.steps.audience',      icon: Users,          labelKey: 'wizard.steps.audience' },
  { key: 'wizard.steps.language',      icon: Globe,          labelKey: 'wizard.steps.language' },
  { key: 'wizard.steps.length',        icon: AlignJustify,   labelKey: 'wizard.steps.length' },
  { key: 'wizard.steps.sections',      icon: Layers,         labelKey: 'wizard.steps.sections' },
  { key: 'wizard.steps.customization', icon: Palette,        labelKey: 'wizard.steps.customization' },
  { key: 'wizard.steps.problem',       icon: MessageSquare,  labelKey: 'wizard.steps.problem' },
  { key: 'wizard.steps.confirm',       icon: CheckCircle2,   labelKey: 'wizard.steps.confirm' },
];

const LANG_LABELS: Record<string, string> = { FR: 'Français', EN: 'English', AR: 'العربية' };
const AUD_LABELS: Record<string, string>  = { INTERNAL: 'Interne', INVESTORS: 'Investisseurs', BANK: 'Banque' };
const LEN_LABELS: Record<string, string>  = { SHORT: 'Court ~5p', MEDIUM: 'Moyen ~10p', LONG: 'Complet ~18p' };

/* ─── Book Cover 3D ──────────────────────────────────────────────────── */
const BookCover3D = ({ state }: { state: WizardFormState }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Cap rotation at 15 degrees max
    setRotateX(-y / (box.height / 30));
    setRotateY(x / (box.width / 30));
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const primaryCol = state.primaryColor || '#0f172a';
  const secondaryCol = state.secondaryColor || '#1e293b';

  return (
    <div 
      className="py-2 flex justify-center items-center cursor-pointer select-none"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      <div
        className="w-48 h-64 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.75)] border border-white/15 relative overflow-hidden transition-all duration-300 ease-out flex flex-col justify-between p-4 group"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}, 1)`,
          background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0%, transparent 60%), linear-gradient(135deg, ${primaryCol} 0%, ${secondaryCol} 100%)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Pronounced sliding reflection sheen */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transition-transform duration-1000 ease-out"
          style={{
            transform: isHovered ? 'translate3d(100%, 100%, 0) rotate(45deg)' : 'translate3d(-100%, -100%, 0) rotate(45deg)',
            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Book Spine Overlay */}
        <div className="absolute top-0 left-0 w-3.5 h-full bg-gradient-to-r from-black/30 via-black/15 to-transparent backdrop-blur-[1px] shadow-[inset_-2px_0_5px_rgba(0,0,0,0.3)] border-r border-white/5 pointer-events-none" />
        
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top Branding Section */}
        <div className="flex items-center gap-1.5 self-end" style={{ transform: 'translateZ(20px)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-[7px] font-extrabold text-white/80 uppercase tracking-widest font-mono">SmartBiz AI</span>
        </div>

        {/* Dynamic Title / Content */}
        <div className="my-auto text-left pl-3.5" style={{ transform: 'translateZ(30px)' }}>
          {state.logo && (
            <img 
              src={state.logo} 
              alt="Brand Logo" 
              className="max-h-7 max-w-[80px] object-contain mb-3 rounded p-1 bg-white/10 backdrop-blur-sm border border-white/10" 
            />
          )}
          <span className="text-[8px] font-black uppercase tracking-widest text-[#00d1ff] bg-black/45 px-2 py-0.5 rounded border border-white/5 font-mono">
            {state.reportType ? state.reportType.replace(/_/g, ' ') : 'RAPPORT'}
          </span>
          <h3 className="text-sm font-extrabold text-white mt-2 leading-snug drop-shadow-md font-sans tracking-tight">
            {state.problemStatement ? (state.problemStatement.length > 50 ? state.problemStatement.slice(0, 50) + '...' : state.problemStatement) : 'Rapport de Diagnostic'}
          </h3>
        </div>

        {/* Bottom Metadata Section */}
        <div className="flex justify-between items-center pl-3.5 mt-auto border-t border-white/10 pt-2 text-[7px] font-extrabold text-white/60 tracking-wider font-mono" style={{ transform: 'translateZ(15px)' }}>
          <span>CONFIDENTIEL</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Live Preview Panel ─────────────────────────────────────────────── */
const PreviewPanel = ({ 
  state, 
  currentStep, 
  onStepClick 
}: { 
  state: WizardFormState; 
  currentStep: number; 
  onStepClick?: (step: number) => void; 
}) => {
  const { t } = useTranslation();

  const previewItems = [
    {
      icon: BarChart3,
      label: t('wizard.steps.type', 'Type'),
      value: state.reportType ? state.reportType.replace(/_/g, ' ') : '—',
      done: !!state.reportType,
      stepIndex: 1,
    },
    {
      icon: Users,
      label: t('wizard.steps.audience', 'Audience'),
      value: state.audience ? AUD_LABELS[state.audience] ?? state.audience : '—',
      done: !!state.audience,
      stepIndex: 2,
    },
    {
      icon: Globe,
      label: t('wizard.steps.language', 'Langue'),
      value: state.language ? LANG_LABELS[state.language] ?? state.language : '—',
      done: !!state.language,
      stepIndex: 3,
    },
    {
      icon: AlignJustify,
      label: t('wizard.steps.length', 'Longueur'),
      value: state.lengthProfile ? LEN_LABELS[state.lengthProfile] ?? state.lengthProfile : '—',
      done: !!state.lengthProfile,
      stepIndex: 4,
    },
    {
      icon: Layers,
      label: t('wizard.steps.sections', 'Sections'),
      value: state.sections.length > 0 ? `${state.sections.length} sélectionnée(s)` : 'Auto',
      done: true,
      stepIndex: 5,
    },
    {
      icon: Palette,
      label: t('wizard.steps.customization', 'Branding'),
      value: state.logo ? 'Logo chargé' : 'Par défaut',
      done: true,
      stepIndex: 6,
    },
  ];

  return (
    <aside className="hidden xl:flex flex-col gap-5 w-[320px] shrink-0">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 border flex flex-col gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,209,255,0.07) 0%, rgba(99,102,241,0.05) 100%)',
          borderColor: 'rgba(0,209,255,0.15)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.2) 0%, transparent 70%)', filter: 'blur(16px)' }}
        />
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,209,255,0.12)', border: '1px solid rgba(0,209,255,0.2)' }}
          >
            <BookOpen className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand uppercase tracking-widest">
              {t('wizard.preview.title', 'Aperçu du rapport')}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {t('wizard.preview.subtitle', 'Mis à jour en temps réel')}
            </p>
          </div>
        </div>

        {/* 3D Book Cover Interactive */}
        <BookCover3D state={state} />
      </div>

      {/* Live detail list */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
            {t('wizard.preview.config', 'Configuration')}
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {previewItems.map(({ icon: Icon, label, value, done, stepIndex }, idx) => {
            const isFilled = done && currentStep > idx + 1;
            const isClickable = isFilled && onStepClick;

            return (
              <div 
                key={label} 
                onClick={() => isClickable && onStepClick(stepIndex)}
                className={`flex items-center gap-3 px-4 py-3 transition-all ${
                  isClickable 
                    ? 'cursor-pointer hover:bg-brand/5 active:scale-98' 
                    : ''
                }`}
                title={isClickable ? 'Retourner à cette étape' : undefined}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{
                    background: isFilled ? 'rgba(0,209,255,0.12)' : 'var(--bg-elevated)',
                    border: `1px solid ${isFilled ? 'rgba(0,209,255,0.2)' : 'var(--border-color)'}`,
                  }}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isFilled ? 'text-brand' : 'text-text-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
                  <p className={`text-xs font-semibold truncate mt-0.5 transition-colors ${isFilled ? 'text-text-main group-hover:text-brand' : 'text-text-muted/50'}`}>
                    {value}
                  </p>
                </div>
                {isFilled && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 animate-scale-up" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress ring hint */}
      <div
        className="rounded-2xl p-4 border text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(0,209,255,0.04) 100%)',
          borderColor: 'rgba(16,185,129,0.15)',
        }}
      >
        <p className="text-[11px] text-text-muted">
          {t('wizard.preview.step', 'Étape')} <span className="text-brand font-bold">{currentStep}</span>{' '}
          {t('wizard.preview.of', 'sur')} <span className="font-bold text-text-main">{STEPS.length}</span>
        </p>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.round((currentStep / STEPS.length) * 100)}%`,
              background: 'linear-gradient(90deg, var(--brand), var(--secondary))',
            }}
          />
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          {Math.round((currentStep / STEPS.length) * 100)}% {t('wizard.preview.complete', 'complété')}
        </p>
      </div>
    </aside>
  );
};

/* ─── Main Wizard ────────────────────────────────────────────────────── */
export const ReportWizard = ({ onSuccess }: ReportWizardProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<WizardFormState>({
    reportType: 'FINANCIAL',
    audience: RA.INTERNAL,
    language: RL.FR,
    lengthProfile: RLP.MEDIUM,
    sections: [],
    primaryColor: '#1E3A5F',
    secondaryColor: '#2563EB',
    logo: '',
    problemStatement: '',
  });

  const TOTAL_STEPS = STEPS.length;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 1:
        if (!state.reportType) newErrors.reportType = t('wizard.errors.selectReportType', 'Please select a report type');
        break;
      case 2:
        if (!state.audience) newErrors.audience = t('wizard.errors.selectAudience', 'Please select your target audience');
        break;
      case 3:
        if (!state.language) newErrors.language = t('wizard.errors.selectLanguage', 'Please select a language');
        break;
      case 4:
        if (!state.lengthProfile) newErrors.lengthProfile = t('wizard.errors.selectLength', 'Please select report length');
        break;
      case 5:
        if (state.problemStatement.length > 2000) newErrors.problemStatement = t('wizard.errors.problemStatementMaxLength', 'Problem statement is too long');
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerate = async () => {
    if (!validateStep(TOTAL_STEPS)) return;
    try {
      setGenerating(true);
      const result = await reportApi.generate({
        reportTypes: [state.reportType],
        audience: state.audience,
        language: state.language,
        lengthProfile: state.lengthProfile,
        sections: state.sections.length > 0 ? state.sections : undefined,
        primaryColor: state.primaryColor || undefined,
        secondaryColor: state.secondaryColor || undefined,
        logoBase64: state.logo || undefined,
        problemStatement: state.problemStatement.trim() || undefined,
        includeCharts: true,
        includeBenchmark: true,
      });
      setGeneratedReportId(result.id);
      toast.success(t('wizard.success', 'Report generation started!'));
      onSuccess?.(result.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('wizard.error', 'Failed to start report generation');
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  if (generatedReportId) {
    return (
      <ReportProgress
        reportId={generatedReportId}
        onBack={() => {
          setGeneratedReportId(null);
          setCurrentStep(1);
          setState({ reportType: 'FINANCIAL', audience: RA.INTERNAL, language: RL.FR, lengthProfile: RLP.MEDIUM, sections: [], primaryColor: '#1E3A5F', secondaryColor: '#2563EB', logo: '', problemStatement: '' });
        }}
      />
    );
  }

  const stepProps = { state, setState, errors, setErrors };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ReportType {...stepProps} />;
      case 2: return <Step2Audience {...stepProps} />;
      case 3: return <Step2Language {...stepProps} />;
      case 4: return <Step3ReportLength {...stepProps} />;
      case 5: return <Step5Sections {...stepProps} />;
      case 6: return <Step6Customization {...stepProps} />;
      case 7: return <Step4ProblemStatement {...stepProps} />;
      case 8: return <Step5Confirmation {...stepProps} />;
      default: return null;
    }
  };

  return (
    <div className="flex gap-8 items-start w-full">
      {/* ── LEFT: Live Preview Panel ── */}
      <PreviewPanel state={state} currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* ── RIGHT: Wizard ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Wizard Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 border"
          style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(0,209,255,0.03) 100%)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 pointer-events-none rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.08) 0%, transparent 70%)', filter: 'blur(20px)' }}
          />
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,209,255,0.15), rgba(99,102,241,0.1))',
                border: '1px solid rgba(0,209,255,0.2)',
                boxShadow: '0 0 20px rgba(0,209,255,0.1)',
              }}
            >
              <FileText className="w-6 h-6 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">
                  {t('wizard.badge', 'AI-Powered')}
                </span>
              </div>
              <h1 className="text-xl font-bold text-text-main">
                {t('wizard.title', 'Générateur de Rapport')}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {t('wizard.subtitle', 'Répondez aux questions — votre rapport PDF professionnel sera prêt en minutes.')}
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress Track */}
        <div
          className="rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center justify-between relative">
            {STEPS.map(({ key, icon: StepIcon, labelKey }, idx) => {
              const stepNum   = idx + 1;
              const isDone    = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              
              return (
                <div key={key} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        isCurrent ? 'ring-4 ring-brand/20 animate-[pulse_2s_infinite]' : ''
                      }`}
                      style={{
                        background: isDone
                          ? 'rgba(0,209,255,0.15)'
                          : isCurrent
                          ? 'var(--brand)'
                          : 'var(--bg-elevated)',
                        border: isDone
                          ? '1px solid rgba(0,209,255,0.3)'
                          : isCurrent
                          ? '1px solid var(--brand)'
                          : '1px solid var(--border-color)',
                        boxShadow: isCurrent ? '0 0 16px rgba(0,209,255,0.4)' : 'none',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                      ) : (
                        <span className={`text-xs font-bold font-mono transition-colors duration-300 ${isCurrent ? 'text-white' : 'text-text-muted/60'}`}>
                          {stepNum}
                        </span>
                      )}
                    </div>
                    {/* Label below the step */}
                    <span 
                      className={`hidden md:block text-[10px] font-extrabold uppercase tracking-wider text-center max-w-[80px] truncate transition-colors duration-300 ${
                        isCurrent ? 'text-brand' : isDone ? 'text-text-main/80' : 'text-text-muted/40'
                      }`}
                    >
                      {t(labelKey)}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className="h-1 flex-1 -mx-2.5 rounded-full transition-all duration-500 relative -top-3 md:-top-7"
                      style={{
                        background: stepNum < currentStep
                          ? 'linear-gradient(90deg, var(--brand), var(--secondary))'
                          : 'var(--border-color)',
                        boxShadow: stepNum < currentStep ? '0 0 8px rgba(0,209,255,0.2)' : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted mt-4 md:mt-1 text-right font-medium">
            {t('wizard.step', 'Étape {{current}} sur {{total}}', { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        {/* Step Content Card */}
        <div
          className="rounded-2xl border p-6 md:p-8 animate-fade-scale relative overflow-hidden"
          style={{
            borderColor: 'var(--border-color-strong, var(--border-color))',
            background: 'var(--bg-surface)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Subtle upper-right ambient glow */}
          <div
            className="absolute -top-16 -right-16 w-32 h-32 pointer-events-none rounded-full"
            style={{ 
              background: 'radial-gradient(circle, rgba(0,209,255,0.06) 0%, transparent 70%)', 
              filter: 'blur(16px)' 
            }}
          />
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border-border hover:bg-elevated hover:text-text-main transition-all duration-300 active:scale-98 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            {t('wizard.back', 'Retour')}
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button 
              onClick={handleNext} 
              className="flex items-center gap-1.5 px-8 py-2.5 rounded-xl bg-brand text-white hover:brightness-110 shadow-md shadow-brand/10 transition-all duration-300 active:scale-98"
            >
              {t('wizard.next', 'Suivant')}
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-8 py-2.5 rounded-xl text-background font-bold transition-all duration-300 active:scale-98 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--brand), var(--secondary))',
                boxShadow: generating ? 'none' : '0 4px 20px rgba(0,209,255,0.25)',
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('wizard.generating', 'Génération...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('wizard.generateButton', 'Générer le rapport')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
