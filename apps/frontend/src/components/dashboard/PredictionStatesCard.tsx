import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, Sparkles, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { RevenueProjectionChart } from './RevenueProjectionChart';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import type { PredictionResult } from '../../types/dashboard';

interface PredictionStatesCardProps {
  prediction: PredictionResult | null;
  loading: boolean;
  onRunPrediction: () => void;
  onNavigateImport: () => void;
}

export const PredictionStatesCard = ({
  prediction,
  loading,
  onRunPrediction,
  onNavigateImport,
}: PredictionStatesCardProps) => {
  const { t } = useTranslation();

  /* ─── State: Loading (running prediction) ─── */
  if (loading) {
    return (
      <div className="dashboard-card flex flex-col items-center justify-center gap-4 py-16">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <div className="absolute inset-0 w-10 h-10 bg-brand/20 blur-xl rounded-full" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-text-main">
            {t('dashboard.mlZone.pendingTitle', 'Prediction in progress')}
          </p>
          <p className="text-xs text-text-muted">
            {t('dashboard.mlZone.pendingHint', 'Please wait a few seconds and refresh this tab.')}
          </p>
        </div>
      </div>
    );
  }

  /* ─── State: No prediction at all ─── */
  if (!prediction || (!prediction.hasPrediction && !prediction.status)) {
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
    return (
      <div className="dashboard-card flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-text-main">
            {t('dashboard.mlZone.pendingTitle', 'Prediction in progress')}
          </p>
          <p className="text-xs text-text-muted">
            {t('dashboard.mlZone.pendingHint', 'Please wait a few seconds and refresh this tab.')}
          </p>
        </div>
      </div>
    );
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
            {new Date(prediction.createdAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Revenue Projection Chart */}
      <RevenueProjectionChart scenarios={scenarios} valuation={valuation} />

      {/* Feature Importance Chart */}
      {featureImportance && (
        <FeatureImportanceChart featureImportance={featureImportance} />
      )}

      {/* Confidence summary cards */}
      {prediction.confidence && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['Y1', 'Y2', 'Y3'] as const).map((horizon) => {
            const band = prediction.confidence![horizon];
            if (!band) return null;
            return (
              <div key={horizon} className="dashboard-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    {horizon} Confidence
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                    {(band.directional_accuracy * 100).toFixed(0)}% acc.
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-main tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                    ±{(band.mae * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-muted uppercase">MAE</span>
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Low: {(band.band_low * 100).toFixed(1)}%</span>
                  <span>High: {(band.band_high * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
