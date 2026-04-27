import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileText, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui';
import { reportApi } from '../../lib/reportApi';
import { ReportLanguage as RL, ReportLengthProfile as RLP, ReportAudience as RA } from '../../types/report';
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

const STEP_LABELS = [
  'wizard.steps.type',
  'wizard.steps.audience',
  'wizard.steps.language',
  'wizard.steps.length',
  'wizard.steps.sections',
  'wizard.steps.customization',
  'wizard.steps.problem',
  'wizard.steps.confirm',
];

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

  const TOTAL_STEPS = STEP_LABELS.length;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!state.reportType) {
          newErrors.reportType = t('wizard.errors.selectReportType', 'Please select a report type');
        }
        break;
      case 2:
        if (!state.audience) {
          newErrors.audience = t('wizard.errors.selectAudience', 'Please select your target audience');
        }
        break;
      case 3:
        if (!state.language) {
          newErrors.language = t('wizard.errors.selectLanguage', 'Please select a language');
        }
        break;
      case 4:
        if (!state.lengthProfile) {
          newErrors.lengthProfile = t('wizard.errors.selectLength', 'Please select report length');
        }
        break;
      case 5:
        // Problem statement is optional (max 2000 chars)
        if (state.problemStatement.length > 2000) {
          newErrors.problemStatement = t('wizard.errors.problemStatementMaxLength', 'Problem statement is too long');
        }
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
          setState({
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

  const progressPct = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
      <div className="mx-auto max-w-xl px-4">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-blue-100 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              {t('wizard.badge', 'AI-Powered Report')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            {t('wizard.title', 'Report Generator')}
          </h1>
          <p className="text-slate-500 text-sm">
            {t('wizard.subtitle', 'Answer 5 quick questions — your professional PDF report is ready in minutes.')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          {/* Step dots */}
          <div className="flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${isDone
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bar */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 text-right">
            {t('wizard.step', 'Step {{current}} of {{total}}', { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('wizard.back', 'Back')}
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNext} className="flex items-center gap-2 px-8">
              {t('wizard.next', 'Next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('wizard.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('wizard.generateButton', 'Generate Report')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
