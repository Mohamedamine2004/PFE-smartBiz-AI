import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, AlertCircle, Download, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';
import { reportApi } from '../../lib/reportApi';
import type { ReportJobStatus } from '../../types/report';

interface ReportProgressProps {
  reportId: string;
  onBack?: () => void;
}

const PROGRESS_STEPS = [
  'Loading financial data',
  'Generating Executive Summary',
  'Analyzing SWOT factors',
  'Processing Performance metrics',
  'Creating Financial overview',
  'Drafting Recommendations',
  'Compiling Forecasts & Trends',
  'Building PDF report',
  'Finalizing document',
];

export const ReportProgress = ({ reportId, onBack }: ReportProgressProps) => {
  const { t } = useTranslation();
  const [report, setReport] = useState<ReportJobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const pollStatus = useCallback(async () => {
    try {
      const status = await reportApi.status(reportId);
      setReport(status);

      // Update progress based on status
      if (status.status === 'QUEUED') {
        setCurrentStep(0);
      } else if (status.status === 'PROCESSING') {
        // Simulate progress for visual feedback
        setCurrentStep((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
      } else if (status.status === 'COMPLETED') {
        setCurrentStep(PROGRESS_STEPS.length);
      }
    } catch (err) {
      console.error('Failed to fetch report status:', err);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const handleDownload = async () => {
    if (!report?.downloadable) return;
    try {
      setDownloading(true);
      const { blob, filename } = await reportApi.download(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('report.downloadSuccess', 'Report downloaded successfully'));
    } catch (err) {
      toast.error(t('report.downloadError', 'Failed to download report'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('report.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold">
            {t('report.notFound', 'Report not found')}
          </p>
        </div>
      </div>
    );
  }

  const isCompleted = report.status === 'COMPLETED';
  const isFailed = report.status === 'FAILED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('report.title', 'Report Generation')}
          </h1>
          <p className="text-slate-600">
            {isCompleted && t('report.statusCompleted', 'Your report is ready')}
            {isFailed && t('report.statusFailed', 'Report generation failed')}
            {report.status === 'PROCESSING' && t('report.statusProcessing', 'Generating your report...')}
            {report.status === 'QUEUED' && t('report.statusQueued', 'Report is queued')}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-8">
            {isCompleted ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : isFailed ? (
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            ) : (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                {isFailed ? 'Generation Failed' : 'Processing'}
              </h2>
              {isFailed && report.error && (
                <p className="text-sm text-red-700">{report.error}</p>
              )}
              {isCompleted && (
                <p className="text-sm text-slate-600">
                  {t('report.completedInfo', 'Generated {{pages}} pages on {{date}}', {
                    pages: report.pageCount || '?',
                    date: new Date(report.generatedAt || '').toLocaleString(),
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 mb-4">
              {t('report.progress', 'Progress')}
            </p>
            {PROGRESS_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep && !isFailed && report.status !== 'COMPLETED';

              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                        ? 'bg-green-100 text-green-700'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs">•</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${isCompleted || isCurrent ? 'text-slate-900 font-medium' : 'text-slate-500'
                      }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('report.newReport', 'Create New Report')}
            </Button>
          )}

          {isCompleted && (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 ml-auto bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('report.downloading', 'Downloading...')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('report.download', 'Download PDF')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
