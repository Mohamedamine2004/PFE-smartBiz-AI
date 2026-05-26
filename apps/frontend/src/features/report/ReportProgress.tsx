import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, AlertCircle, Download, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
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
  }, [reportId, PROGRESS_STEPS.length]);

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
    <div className="flex flex-col items-center justify-center py-24 bg-background text-text-main">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute -inset-4 rounded-full bg-brand/20 blur-lg animate-pulse" />
        <Loader2 className="w-12 h-12 text-brand animate-spin relative" />
      </div>
      <p className="text-text-muted font-medium animate-pulse">{t('report.loading', 'Loading...')}</p>
    </div>
  );

  if (!report) return (
    <div className="flex flex-col items-center py-24 bg-background text-text-main">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute -inset-4 rounded-full bg-rose-500/20 blur-lg" />
        <AlertCircle className="w-12 h-12 text-rose-500 relative" />
      </div>
      <p className="text-text-muted font-medium">{t('report.notFound', 'Report not found')}</p>
    </div>
  );

  const isCompleted = report.status === 'COMPLETED';
  const isFailed = report.status === 'FAILED';
  const pct = Math.min(
    Math.round((currentStep / PROGRESS_STEPS.length) * 100),
    100
  );

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes custom-progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-shimmer {
          animation: custom-progress-shimmer 2s infinite;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]">
        {/* Cockpit Space Aura */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 pointer-events-none rounded-full opacity-60 dark:opacity-40 transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(0,209,255,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className={`flex items-start gap-5 mb-8 relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${
            isCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-scale-in' 
              : isFailed 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-scale-in' 
              : 'bg-brand/10 border-brand/20 text-brand shadow-[0_0_20px_rgba(0,209,255,0.15)] animate-pulse'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : isFailed ? (
              <AlertCircle className="w-7 h-7" />
            ) : (
              <Loader2 className="w-7 h-7 animate-spin" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest font-mono">
                {t('report.badge', 'IA Report Engine')}
              </span>
            </div>
            <h2 className={`text-2xl font-extrabold text-text-main tracking-tight font-display ${isRTL ? 'text-right' : ''}`}>
              {isCompleted && t('report.statusCompleted', 'Report Ready!')}
              {isFailed && t('report.statusFailed', 'Generation Failed')}
              {!isCompleted && !isFailed && t('report.statusProcessing', 'Generating your report...')}
            </h2>
            {isFailed && report.error && (
              <p className={`text-sm text-rose-500 mt-2 font-medium bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 inline-block ${isRTL ? 'text-right' : ''}`}>
                {report.error}
              </p>
            )}
            {isCompleted && (
              <p className={`text-sm text-text-muted mt-1 font-semibold ${isRTL ? 'text-right' : ''}`}>
                {t('report.pagesGenerated', '{{count}} pages generated', { count: report.pageCount || 0 })}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Linear Progress Bar */}
        {!isFailed && (
          <div className="mb-8 p-5 bg-elevated/35 border border-border/50 rounded-2xl relative z-10 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-text-muted tracking-wide">
              <span className="uppercase tracking-widest text-[10px]">
                {isCompleted ? t('report.progress.done', 'Terminé') : t('report.progress.running', 'Génération en cours...')}
              </span>
              <span className="font-bold text-brand text-sm">{pct}%</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-border/40 overflow-hidden relative">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, var(--brand), var(--secondary))',
                  boxShadow: '0 0 16px rgba(0, 209, 255, 0.4)',
                }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] -translate-x-full animate-progress-shimmer" />
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps Timeline */}
        <div className="bg-elevated/25 border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 relative z-10 backdrop-blur-sm">
          {/* Vertical Timeline Connector Line */}
          <div 
            className="absolute top-12 bottom-12 w-0.5 rounded-full bg-border/40 pointer-events-none"
            style={{ [isRTL ? 'right' : 'left']: '39px' }}
          >
            {/* Completed vertical line indicator */}
            <div 
              className="w-full bg-gradient-to-b from-brand to-secondary rounded-full transition-all duration-700 ease-out"
              style={{
                height: `${Math.min(
                  ((currentStep) / PROGRESS_STEPS.length) * 100,
                  100
                )}%`,
                boxShadow: '0 0 8px var(--brand)',
              }}
            />
          </div>

          {PROGRESS_STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isCurrent = index === currentStep && !isFailed && !isCompleted;
            
            return (
              <div 
                key={index} 
                className={`flex items-center gap-5 relative transition-all duration-300 ${
                  isCurrent 
                    ? 'scale-[1.01] translate-x-1.5' 
                    : ''
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {/* Circular Number / Bullet */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black font-mono transition-all duration-300 relative z-10 ${
                    isCurrent ? 'ring-4 ring-brand/20' : ''
                  }`}
                  style={{
                    background: isDone
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isCurrent
                      ? 'var(--brand)'
                      : 'var(--bg-elevated)',
                    border: isDone
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isCurrent
                      ? '1px solid var(--brand)'
                      : '1px solid var(--border-color)',
                    boxShadow: isDone 
                      ? '0 0 10px rgba(16, 185, 129, 0.1)' 
                      : isCurrent 
                      ? '0 0 16px rgba(0, 209, 255, 0.4)' 
                      : 'none',
                    color: isDone 
                      ? 'rgba(52, 211, 153, 1)' 
                      : isCurrent 
                      ? '#ffffff' 
                      : 'var(--text-secondary)',
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Timeline step details */}
                <div 
                  className={`flex-1 p-3.5 rounded-2xl border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-brand/5 border-brand/25 shadow-md shadow-brand/5' 
                      : isDone
                      ? 'bg-elevated/10 border-border/30 opacity-80'
                      : 'bg-transparent border-transparent opacity-40'
                  }`}
                >
                  <span className={`text-sm tracking-wide transition-colors duration-300 ${
                    isDone 
                      ? 'text-text-main/80 font-semibold line-through decoration-text-muted/30' 
                      : isCurrent 
                      ? 'text-brand font-extrabold animate-pulse' 
                      : 'text-text-muted font-medium'
                  }`}>
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-wrap gap-4 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        {onBack && (
          <Button 
            onClick={onBack} 
            variant="outline" 
            className={`flex items-center gap-2.5 px-6 border-border text-text-muted hover:text-text-main hover:bg-elevated transition-all duration-300 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('report.newReport', 'New Report')}
          </Button>
        )}
        {isCompleted && (
          <>
            <Button 
              onClick={() => setShowPreview((v) => !v)} 
              variant="outline" 
              className={`flex items-center gap-2.5 px-6 border-border text-text-muted hover:text-text-main hover:bg-elevated transition-all duration-300 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? t('report.hidePreview', 'Hide preview') : t('report.showPreview', 'PDF Preview')}
            </Button>
            <Button 
              onClick={handleDownload} 
              disabled={downloading} 
              className={`flex items-center gap-2.5 px-8 rounded-xl ${isRTL ? 'flex-row-reverse ms-0 me-auto' : 'ml-auto'} bg-gradient-to-r from-brand to-secondary hover:brightness-110 text-background font-bold shadow-[0_4px_20px_rgba(0,209,255,0.25)] dark:shadow-[0_4px_20px_rgba(0,209,255,0.1)] transition-all duration-300 disabled:opacity-50`}
            >
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
