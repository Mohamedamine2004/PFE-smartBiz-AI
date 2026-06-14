import type { ConfidenceMetrics } from '../../types/dashboard';
import { useTranslation } from 'react-i18next';

interface PredictionConfidenceGridProps {
  confidence: ConfidenceMetrics;
}

export const PredictionConfidenceGrid = ({ confidence }: PredictionConfidenceGridProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {(['Y1', 'Y2', 'Y3'] as const).map((horizon) => {
        const band = confidence[horizon];
        if (!band) return null;

        return (
          <div key={horizon} className="dashboard-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                {t('dashboard.prediction.confidenceForHorizon', { horizon })}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                {(band.directional_accuracy * 100).toFixed(0)}% {t('dashboard.prediction.accuracyShort')}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-text-main tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                ±{(band.mae * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-text-muted uppercase">{t('dashboard.prediction.maeLabel')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>{t('dashboard.prediction.low')}: {((band.band_low ?? 0.12) * 100).toFixed(1)}%</span>
              <span>{t('dashboard.prediction.high')}: {((band.band_high ?? 0.12) * 100).toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
