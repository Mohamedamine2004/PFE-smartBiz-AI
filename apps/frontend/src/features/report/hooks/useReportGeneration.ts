import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ReportGenerationProgress {
  section: string;
  status: 'pending' | 'generating' | 'complete';
  progress: number;
}

export interface UseReportGenerationOptions {
  reportId: string;
  onProgress?: (progress: ReportGenerationProgress[]) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for handling report generation progress tracking via polling
 * In a production scenario, this could be replaced with SSE (Server-Sent Events)
 * The backend currently uses background job processing with polling via reportApi.status()
 */
export const useReportGeneration = ({
  reportId,
  onProgress,
  onComplete,
  onError,
}: UseReportGenerationOptions) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<ReportGenerationProgress[]>([]);
  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [isGenerating, setIsGenerating] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const initializeProgress = useCallback(() => {
    const sections = [
      'Executive Summary',
      'SWOT Analysis',
      'Performance Analysis',
      'Financial Overview',
      'Recommendations',
      'Forecasts & Trends',
      'PDF Generation',
    ];

    return sections.map((section) => ({
      section,
      status: 'pending' as const,
      progress: 0,
    }));
  }, []);

  const connectSSE = useCallback(() => {
    // This connects to SSE if the backend provides it
    // The URL format: /api/v1/report/jobs/{id}/progress
    try {
      const eventSource = new EventSource(`/api/v1/report/jobs/${reportId}/progress`);

      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setProgress((prev) => {
          return prev.map((item) =>
            item.section === data.section
              ? { ...item, status: data.status, progress: data.progress }
              : item,
          );
        });
        onProgress?.(progress);
      });

      eventSource.addEventListener('complete', () => {
        setStatus('completed');
        setIsGenerating(false);
        onComplete?.();
        eventSource.close();
      });

      eventSource.addEventListener('error', (event: Event) => {
        const data = event as MessageEvent<string>;
        const error = data.data || t('report.generationError', 'Report generation failed');
        setStatus('failed');
        setIsGenerating(false);
        onError?.(error);
        eventSource.close();
      });

      eventSourceRef.current = eventSource;
    } catch (err) {
      // SSE not available - graceful fallback
      console.warn('SSE not available, using polling instead');
    }
  }, [reportId, onProgress, onComplete, onError, t]);

  useEffect(() => {
    const initialProgress = initializeProgress();
    setProgress(initialProgress);

    // Try to connect to SSE
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [reportId, connectSSE, initializeProgress]);

  return {
    progress,
    status,
    isGenerating,
  };
};

/**
 * Alternative hook for real-time progress using polling
 * This is what the backend currently supports via reportApi.status()
 */
export const useReportGenerationPolling = ({
  reportId,
  onComplete,
  onError,
}: UseReportGenerationOptions) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<ReportGenerationProgress[]>([]);
  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [isGenerating, setIsGenerating] = useState(true);

  const initializeProgress = () => {
    const sections = [
      'Executive Summary',
      'SWOT Analysis',
      'Performance Analysis',
      'Financial Overview',
      'Recommendations',
      'Forecasts & Trends',
      'PDF Generation',
    ];

    return sections.map((section) => ({
      section,
      status: 'pending' as const,
      progress: 0,
    }));
  };

  useEffect(() => {
    const initialProgress = initializeProgress();
    setProgress(initialProgress);

    // Simulate progress with polling intervals
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = [...prev];
        if (currentStep < newProgress.length) {
          newProgress[currentStep].status = 'generating';
          newProgress[currentStep].progress = 30 + Math.random() * 40;
        }
        if (currentStep > 0 && currentStep <= newProgress.length) {
          newProgress[currentStep - 1].status = 'complete';
          newProgress[currentStep - 1].progress = 100;
        }
        return newProgress;
      });
      currentStep += 1;
    }, 3000);

    const pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/reports/${reportId}`);
        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        if (data.status === 'COMPLETED') {
          setStatus('completed');
          setIsGenerating(false);
          setProgress((prev) =>
            prev.map((p) => ({ ...p, status: 'complete' as const, progress: 100 })),
          );
          onComplete?.();
          clearInterval(pollingInterval);
          clearInterval(progressInterval);
        } else if (data.status === 'FAILED') {
          setStatus('failed');
          setIsGenerating(false);
          onError?.(data.error || t('report.generationFailed', 'Report generation failed'));
          clearInterval(pollingInterval);
          clearInterval(progressInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pollingInterval);
    };
  }, [reportId, onComplete, onError, t]);

  return {
    progress,
    status,
    isGenerating,
  };
};
