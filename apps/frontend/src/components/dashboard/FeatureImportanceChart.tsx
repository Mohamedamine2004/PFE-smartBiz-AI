import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import type { FeatureImportanceItem } from '../../types/dashboard';

interface FeatureImportanceChartProps {
  featureImportance: Record<string, FeatureImportanceItem[]>;
}

/* Human-readable feature labels */
const FEATURE_LABELS: Record<string, string> = {
  Assets_Momentum_1Y: 'Asset Growth',
  Revenues_Momentum_1Y: 'Revenue Growth',
  Liabilities_Momentum_1Y: 'Debt Growth',
  Revenues_Momentum_2Y: 'Revenue Trend (2Y)',
  Revenues_Accel: 'Revenue Acceleration',
  Revenues_Momentum_1Y_Rank: 'Revenue Growth Rank',
  LeverageRatio: 'Leverage Ratio',
  sic1: 'Industry Sector',
  CashFlow_to_Assets: 'Cash Flow / Assets',
  OperatingMargin: 'Operating Margin',
  Accruals: 'Accruals',
  AssetTurnover_Rank: 'Asset Turnover Rank',
  AssetTurnover: 'Asset Turnover',
  AssetTurnover_Momentum_1Y: 'Asset TO Momentum',
  OperatingMargin_Rank: 'Margin Rank',
  CashFlow_Margin_Rank: 'CF Margin Rank',
  Pred_Y1: 'Y1 Prediction (cascade)',
  Pred_Y2: 'Y2 Prediction (cascade)',
};

/* Color palette for bars */
const BAR_COLORS = [
  '#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD',
  '#10B981', '#34D399', '#6EE7B7', '#A7F3D0',
];

/* Custom Tooltip */
const ImportanceTooltip = ({ active, payload, labelText }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{data.label}</p>
      <div className="tooltip-row">
        <span className="tooltip-name">{labelText}</span>
        <span className="tooltip-value">{data.importance.toFixed(2)}%</span>
      </div>
    </div>
  );
};

export const FeatureImportanceChart = ({ featureImportance }: FeatureImportanceChartProps) => {
  const { t } = useTranslation();
  const horizons = ['Y1', 'Y2', 'Y3'] as const;
  const [activeHorizon, setActiveHorizon] = useState<string>('Y1');

  const chartData = useMemo(() => {
    const items = featureImportance[activeHorizon] || [];
    return items
      .slice(0, 8)
      .map((item) => ({
        feature: item.feature,
        label: FEATURE_LABELS[item.feature] || item.feature,
        importance: item.importance,
      }));
  }, [featureImportance, activeHorizon]);

  return (
    <div className="chart-container">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="space-y-1 text-left">
          <h3
            className="text-lg font-bold text-text-primary tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('dashboard.mlZone.featureImportanceTitle', 'ML Model Insights')}
          </h3>
          <p className="text-xs font-medium text-text-muted">
            {t('dashboard.mlZone.featureHint', 'These factors show what most influences the projection.')}
          </p>
        </div>

        {/* Horizon tabs */}
        <div className="flex items-center bg-elevated border border-border rounded-lg p-1">
          {horizons.map((h) => (
            <button
              key={h}
              onClick={() => setActiveHorizon(h)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeHorizon === h
                  ? 'bg-surface text-text-main shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.mlZone.noData', 'No prediction data available.')}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="featureBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              strokeOpacity={0.4}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              content={<ImportanceTooltip labelText={t('dashboard.mlZone.importance')} />}
              cursor={{ fill: 'var(--border-color)', opacity: 0.1 }}
            />
            <Bar
              dataKey="importance"
              name={t('dashboard.mlZone.impact', 'Impact')}
              radius={[0, 6, 6, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              barSize={24}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
