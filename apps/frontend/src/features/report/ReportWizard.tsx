import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { reportApi } from '../../lib/reportApi';
import type {
  ReportLanguage,
  ReportLengthProfile,
  ReportType,
  ReportTone,
  ReportSection,
} from '../../types/report';
import { ReportLanguage as RL, ReportLengthProfile as RLP } from '../../types/report';
import { Step1ReportType } from './steps/Step1ReportType';
import { Step2Language } from './steps/Step2Language';
import { Step3ReportLength } from './steps/Step3ReportLength';
import { Step4MainProblem } from './steps/Step4MainProblem';
import { Step5Sections } from './steps/Step5Sections';
import { Step6Tone } from './steps/Step6Tone';
import { Step7Confirmation } from './steps/Step7Confirmation';
import type { WizardFormState } from './types';
import { ReportProgress } from './ReportProgress';

interface ReportWizardProps {
  onSuccess?: (reportId: string) => void;
}

export const ReportWizard = ({ onSuccess }: ReportWizardProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);

  const [state, setState] = useState<WizardFormState>({
    reportType: 'FINANCIAL' as ReportType,
    language: RL.FR,
    pageCount: 20,
    mainProblem: '',
    sections: [],
    tone: 'PROFESSIONAL' as ReportTone,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const TOTAL_STEPS = 7;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!state.reportType) {
          newErrors.reportType = t('wizard.errors.selectReportType', 'Please select a report type');
        }
        break;
      case 2:
        if (!state.language) {
          newErrors.language = t('wizard.errors.selectLanguage', 'Please select a language');
        }
        break;
      case 3:
        if (!state.pageCount) {
          newErrors.pageCount = t('wizard.errors.selectPageCount', 'Please select report length');
        }
        break;
      case 4:
        if (state.mainProblem.trim().length < 10) {
          newErrors.mainProblem = t(
            'wizard.errors.problemStatementMinLength',
            'Please describe your problem in at least 10 characters',
          );
        }
        if (state.mainProblem.length > 2000) {
          newErrors.mainProblem = t('wizard.errors.problemStatementMaxLength', 'Problem statement is too long');
        }
        break;
      case 5:
        if (state.sections.length === 0) {
          newErrors.sections = t('wizard.errors.selectAtLeastOneSection', 'Please select at least one section');
        }
        break;
      case 6:
        if (!state.tone) {
          newErrors.tone = t('wizard.errors.selectTone', 'Please select a tone');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerate = async () => {
    if (!validateStep(TOTAL_STEPS)) return;

    try {
      setGenerating(true);

      // Map page count to report length profile
      const lengthProfileMap: Record<10 | 20 | 30, ReportLengthProfile> = {
        10: RLP.SHORT,
        20: RLP.MEDIUM,
        30: RLP.LONG,
      };

      const payload = {
        language: state.language as ReportLanguage,
        lengthProfile: lengthProfileMap[state.pageCount],
        reportTypes: [state.reportType],
        problemStatement: state.mainProblem,
        tone: state.tone as ReportTone,
        sections: state.sections as ReportSection[],
        includeCharts: true,
      };

      const result = await reportApi.generate(payload);
      setGeneratedReportId(result.id);
      toast.success(t('wizard.success', 'Report generation started!'));
      onSuccess?.(result.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('wizard.error', 'Failed to generate report');
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  if (generatedReportId) {
    return <ReportProgress reportId={generatedReportId} />;
  }

  const stepProps = { state, setState, errors, setErrors };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ReportType {...stepProps} />;
      case 2:
        return <Step2Language {...stepProps} />;
      case 3:
        return <Step3ReportLength {...stepProps} />;
      case 4:
        return <Step4MainProblem {...stepProps} />;
      case 5:
        return <Step5Sections {...stepProps} />;
      case 6:
        return <Step6Tone {...stepProps} />;
      case 7:
        return <Step7Confirmation {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">{t('wizard.title', 'Report Generator')}</h1>
          </div>
          <p className="text-slate-600">
            {t('wizard.subtitle', 'Create a custom report tailored to your business needs')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {t('wizard.step', 'Step {{current}} of {{total}}', {
                current: currentStep,
                total: TOTAL_STEPS,
              })}
            </span>
            <span className="text-sm text-slate-600">{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">{renderStep()}</div>

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
            <Button onClick={handleNext} className="flex items-center gap-2">
              {t('wizard.next', 'Next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('wizard.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
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
