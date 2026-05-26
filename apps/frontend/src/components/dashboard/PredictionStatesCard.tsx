import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, Sparkles, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { RevenueProjectionChart } from './RevenueProjectionChart';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import { PredictionConfidenceGrid } from './PredictionConfidenceGrid';
import { buildManualProjection } from './predictionStates.utils';
import type {
  PredictionResult,
  DashboardMetrics,
} from '../../types/dashboard';

/* ─── High-Tech Neural Network Scan Loader Component ─── */
const NeuralScanLoader = () => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    t('dashboard.mlZone.step1', 'Initialisation du moteur de prévision neuronal...'),
    t('dashboard.mlZone.step2', 'Analyse et ingestion des flux financiers...'),
    t('dashboard.mlZone.step3', 'Calcul des simulations de Monte Carlo...'),
    t('dashboard.mlZone.step4', 'Modélisation de la confiance de valorisation...'),
  ];

  useEffect(() => {
    // Increment progress counter
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 98) {
          return prev + Math.floor(Math.random() * 4) + 1;
        }
        return 98;
      });
    }, 150);

    // Step progression
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="dashboard-card relative flex flex-col items-center justify-center gap-8 py-16 px-6 overflow-hidden">
      {/* Dynamic Laser Scanning Line */}
      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D1FF] to-transparent shadow-[0_0_15px_#00D1FF] opacity-70 animate-scan-laser top-0 pointer-events-none" />

      {/* Cybernetic Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      {/* Radial Glow Ambient Blob */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-brand/10 blur-[80px] -z-10 animate-pulse" />

      {/* Large Glowing Progress Circle */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Background glow circle */}
        <div className="absolute inset-0 rounded-full border border-brand/10" />
        <div className="absolute inset-2 rounded-full border border-brand/20 border-t-brand animate-spin" />
        <div className="absolute inset-4 rounded-full bg-surface flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-bold text-brand tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-mono)' }}>
            {progress}%
          </span>
          <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
            {t('dashboard.mlZone.processing', 'Analyse')}
          </span>
        </div>
      </div>

      {/* Futuristic Steps Log */}
      <div className="w-full max-w-md space-y-3 bg-elevated/45 backdrop-blur-md rounded-2xl p-6 border border-border/40 relative z-10">
        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 border-b border-border/40 pb-2">
          {t('dashboard.mlZone.neuralScanLog', 'Journal d\'analyse neuronale')}
        </h4>
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            return (
              <div key={idx} className="flex items-center gap-3 transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border text-[10px]">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-ping" />
                  ) : (
                    <span className="text-text-muted/40">○</span>
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isCompleted ? 'text-text-muted/65 line-through decoration-text-muted/30' :
                  isActive ? 'text-brand drop-shadow-[0_0_8px_rgba(0,209,255,0.4)]' :
                  'text-text-muted/40'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-text-main">
          {t('dashboard.mlZone.pendingTitle', 'Calcul des prédictions en cours')}
        </p>
        <p className="text-xs text-text-muted max-w-sm">
          {t('dashboard.mlZone.pendingHint', 'Notre intelligence artificielle segmente vos flux financiers et projette la valeur de vos capitaux propres.')}
        </p>
      </div>
    </div>
  );
};

interface PredictionStatesCardProps {
  prediction: PredictionResult | null;
  loading: boolean;
  onRunPrediction: () => void;
  onNavigateImport: () => void;
  historicalMetrics: DashboardMetrics | null;
}

export const PredictionStatesCard = ({
  prediction,
  loading,
  onRunPrediction,
  onNavigateImport,
  historicalMetrics,
}: PredictionStatesCardProps) => {
  const { t } = useTranslation();

  const manualProjection = useMemo(() => buildManualProjection(historicalMetrics), [historicalMetrics]);

  /* ─── State: Loading (running prediction) ─── */
  if (loading) {
    return <NeuralScanLoader />;
  }

  /* ─── State: No prediction at all ─── */
  if (!prediction || (!prediction.hasPrediction && !prediction.status)) {
    if (manualProjection) {
      return (
        <div className="space-y-4">
          <div className="dashboard-card p-4 border border-brand/20 bg-brand/5">
            <p className="text-sm font-semibold text-text-main">
              {t('dashboard.mlZone.manualModeTitle', 'Manual projection mode active')}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {t('dashboard.mlZone.manualModeHint', 'No ML result found. You can still simulate company and equity value in real time using the controls below.')}
            </p>
          </div>

          <RevenueProjectionChart
            scenarios={manualProjection.scenarios}
            valuation={manualProjection.valuation}
            historicalMetrics={historicalMetrics}
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={onNavigateImport} icon={<Upload className="w-4 h-4" />}>
              {t('dashboard.importBtn', 'Import')}
            </Button>
            <Button onClick={onRunPrediction} icon={<Sparkles className="w-4 h-4" />}>
              {t('dashboard.mlZone.runPrediction', 'Run AI Prediction')}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-card flex flex-col items-center justify-center gap-5 py-16">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 bg-brand/10 rounded-2xl blur-lg" />
          <Sparkles className="w-8 h-8 text-brand relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-text-main">
            {t('dashboard.mlZone.noData', 'No prediction data available.')}
          </p>
          <p className="text-xs text-text-muted max-w-sm">
            {t('dashboard.mlZone.noDataHint', 'Please run the model to generate a projection.')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onNavigateImport} icon={<Upload className="w-4 h-4" />}>
            {t('dashboard.importBtn', 'Import')}
          </Button>
          <Button onClick={onRunPrediction} icon={<Sparkles className="w-4 h-4" />}>
            {t('dashboard.mlZone.runPrediction', 'Run AI Prediction')}
          </Button>
        </div>
      </div>
    );
  }

  /* ─── State: Pending / Processing ─── */
  if (prediction.status === 'PENDING' || prediction.status === 'PROCESSING') {
    return <NeuralScanLoader />;
  }

  /* ─── State: Failed ─── */
  if (prediction.status === 'FAILED' || (!prediction.hasPrediction && prediction.status)) {
    return (
      <div className="dashboard-card flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-red-400">
            {t('dashboard.mlZone.failedTitle', 'Prediction failed')}
          </p>
          <p className="text-xs text-text-muted max-w-md">
            {prediction.error || t('dashboard.mlZone.failedHint', 'The model did not return usable data.')}
          </p>
        </div>
        <Button onClick={onRunPrediction} icon={<Sparkles className="w-4 h-4" />}>
          {t('dashboard.mlZone.runPrediction', 'Run AI Prediction')}
        </Button>
      </div>
    );
  }

  /* ─── State: Completed — render charts ─── */
  const scenarios = prediction.scenarios?.[0];
  const valuation = prediction.valuations?.[0];
  const featureImportance = prediction.feature_importance;

  if (!scenarios || !valuation) {
    return (
      <div className="dashboard-card p-6 text-center">
        <p className="text-text-muted text-sm">{t('dashboard.mlZone.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Model version badge */}
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-brand/10 text-brand border border-brand/20 rounded-md">
          {prediction.model_version || 'v2.0'}
        </span>
        {prediction.createdAt && (
          <span className="text-[11px] text-text-muted">
            {new Date(prediction.createdAt).toLocaleString('fr-FR')}
          </span>
        )}
      </div>

      {/* Revenue Projection Chart */}
      <RevenueProjectionChart scenarios={scenarios} valuation={valuation} historicalMetrics={historicalMetrics} />

      {/* Feature Importance Chart */}
      {featureImportance && (
        <FeatureImportanceChart featureImportance={featureImportance} />
      )}

      {prediction.confidence && <PredictionConfidenceGrid confidence={prediction.confidence} />}
    </div>
  );
};
