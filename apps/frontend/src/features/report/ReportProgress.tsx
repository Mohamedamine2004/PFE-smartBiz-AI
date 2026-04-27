import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, AlertCircle, Download, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui';
import { reportApi } from '../../lib/reportApi';
import { ReportPdfViewer } from './ReportPdfViewer';
import type { ReportJobStatus } from '../../types/report';

interface ReportProgressProps {
  reportId: string;
  onBack?: () => void;
}

export const ReportProgress = ({ reportId, onBack }: ReportProgressProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [report, setReport] = useState<ReportJobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const PROGRESS_STEPS = [
    t('report.progress.step1', 'Loading financial data'),
    t('report.progress.step2', 'Computing sector benchmark'),
    t('report.progress.step3', 'Writing Executive Summary'),
    t('report.progress.step4', 'Detailed financial analysis'),
    t('report.progress.step5', 'Generating charts'),
    t('report.progress.step6', 'Compiling sections'),
    t('report.progress.step7', 'Building PDF'),
    t('report.progress.step8', 'Applying branding'),
    t('report.progress.step9', 'Finalizing document'),
  ];

  const pollStatus = useCallback(async () => {
    try {
      const status = await reportApi.status(reportId);
      setReport(status);
      if (status.status === 'QUEUED') setCurrentStep(0);
      else if (status.status === 'PROCESSING') setCurrentStep((p) => Math.min(p + 1, PROGRESS_STEPS.length - 2));
      else if (status.status === 'COMPLETED') setCurrentStep(PROGRESS_STEPS.length);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [reportId]);

  useEffect(() => {
    void pollStatus();
    const id = setInterval(() => {
      if (report?.status === 'COMPLETED' || report?.status === 'FAILED') return;
      void pollStatus();
    }, 2500);
    return () => clearInterval(id);
  }, [pollStatus, report?.status]);

  const handleDownload = async () => {
    if (!report?.downloadable) return;
    try {
      setDownloading(true);
      const { blob, filename } = await reportApi.download(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('report.downloadSuccess', 'Downloaded!'));
    } catch { toast.error(t('report.downloadError', 'Download failed')); }
    finally { setDownloading(false); }
  };

  if (loading && !report) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p className="text-slate-500">{t('report.loading', 'Loading...')}</p>
    </div>
  );

  if (!report) return (
    <div className="flex flex-col items-center py-24">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-slate-600">{t('report.notFound', 'Report not found')}</p>
    </div>
  );

  const isCompleted = report.status === 'COMPLETED';
  const isFailed = report.status === 'FAILED';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className={`flex items-start gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : isFailed ? <AlertCircle className="w-6 h-6 text-red-600" /> : <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-bold text-slate-900 mb-1 ${isRTL ? 'text-right' : ''}`}>
              {isCompleted && t('report.statusCompleted', 'Report Ready!')}
              {isFailed && t('report.statusFailed', 'Generation Failed')}
              {!isCompleted && !isFailed && t('report.statusProcessing', 'Generating your report...')}
            </h2>
            {isFailed && report.error && <p className={`text-sm text-red-600 ${isRTL ? 'text-right' : ''}`}>{report.error}</p>}
            {isCompleted && (
              <p className={`text-sm text-slate-500 ${isRTL ? 'text-right' : ''}`}>
                {t('report.pagesGenerated', '{{count}} pages generated', { count: report.pageCount || '?' })}
              </p>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-2">
          {PROGRESS_STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isCurrent = index === currentStep && !isFailed && !isCompleted;
            return (
              <div key={index} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {isDone ? '✓' : isCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                </div>
                <span className={`text-sm ${isDone || isCurrent ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {onBack && (
          <Button onClick={onBack} variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('report.newReport', 'New Report')}
          </Button>
        )}
        {isCompleted && (
          <>
            <Button onClick={() => setShowPreview((v) => !v)} variant="outline" className={`flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? t('report.hidePreview', 'Hide preview') : t('report.showPreview', 'PDF Preview')}
            </Button>
            <Button onClick={handleDownload} disabled={downloading} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse ms-0 me-auto' : 'ml-auto'} bg-gradient-to-r from-blue-600 to-indigo-600`}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? t('report.downloading', 'Downloading...') : t('report.downloadPdf', 'Download PDF')}
            </Button>
          </>
        )}
      </div>

      {isCompleted && showPreview && (
        <ReportPdfViewer reportId={reportId} onClose={() => setShowPreview(false)} className="min-h-[700px]" />
      )}
    </div>
  );
};
