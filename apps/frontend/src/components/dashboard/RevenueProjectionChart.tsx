import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import type { ScenarioPrediction, FinancialValuation } from '../../types/dashboard';

interface RevenueProjectionChartProps {
  scenarios: ScenarioPrediction[];
  valuation: FinancialValuation;
}

/* ── Tooltip ── */
const ProjectionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="tooltip-row">
          <div className="flex items-center gap-2">
            <div className="tooltip-dot" style={{ background: entry.color }} />
            <span className="tooltip-name">{entry.name}</span>
          </div>
          <span className="tooltip-value">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const RevenueProjectionChart = ({ scenarios, valuation }: RevenueProjectionChartProps) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const optimistic = scenarios.find(s => s.label === 'optimistic');
    const realistic = scenarios.find(s => s.label === 'realistic');
    const pessimistic = scenarios.find(s => s.label === 'pessimistic');

    if (!optimistic || !realistic || !pessimistic) return [];

    return [
      {
        year: 'Current',
        realistic: valuation.Current_Revenue,
        optimistic: valuation.Current_Revenue,
        pessimistic: valuation.Current_Revenue,
      },
      {
        year: 'Year 1',
        realistic: realistic.Projected_Revenue_Y1,
        optimistic: optimistic.Projected_Revenue_Y1,
        pessimistic: pessimistic.Projected_Revenue_Y1,
      },
      {
        year: 'Year 2',
        realistic: realistic.Projected_Revenue_Y2,
        optimistic: optimistic.Projected_Revenue_Y2,
        pessimistic: pessimistic.Projected_Revenue_Y2,
      },
      {
        year: 'Year 3',
        realistic: realistic.Projected_Revenue_Y3,
        optimistic: optimistic.Projected_Revenue_Y3,
        pessimistic: pessimistic.Projected_Revenue_Y3,
      },
    ];
  }, [scenarios, valuation]);

  // Dynamic Y-axis zoom: focus on the useful data range
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 'auto'] as [number, string];

    const allValues = chartData.flatMap(d => [d.optimistic, d.realistic, d.pessimistic]);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const range = dataMax - dataMin;
    // Add 10% padding on each side, but never go below 0
    const padding = Math.max(range * 0.10, dataMax * 0.02);
    const lower = Math.max(0, dataMin - padding);
    const upper = dataMax + padding;

    return [lower, upper] as [number, number];
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <div className="chart-container">
      <div className="space-y-1 text-left mb-5">
        <h3
          className="text-lg font-bold text-text-primary tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('dashboard.mlZone.revenueProjection', 'Revenue Projection')}
        </h3>
        <p className="text-xs font-medium text-text-muted">
          {t('dashboard.mlZone.maeDisclaimer', 'Projection uncertainty is shown with an estimated MAE range of 12-16%.')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            {/* Optimistic gradient */}
            <linearGradient id="projOptimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
            </linearGradient>
            {/* Pessimistic gradient */}
            <linearGradient id="projPessimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.02} />
            </linearGradient>
            {/* Realistic gradient */}
            <linearGradient id="projRealistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-color)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
              return v;
            }}
          />
          <Tooltip content={<ProjectionTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '12px' }}
            iconType="circle"
            iconSize={8}
          />

          {/* Reference line at current revenue */}
          <ReferenceLine
            y={chartData[0]?.realistic}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          {/* Optimistic band */}
          <Area
            type="monotone"
            dataKey="optimistic"
            name={t('dashboard.mlZone.optimistic', 'Optimistic')}
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#projOptimistic)"
            animationDuration={1200}
            animationEasing="ease-out"
          />

          {/* Realistic line (primary) */}
          <Area
            type="monotone"
            dataKey="realistic"
            name={t('dashboard.mlZone.realistic', 'Realistic')}
            stroke="#6366F1"
            strokeWidth={3}
            fill="url(#projRealistic)"
            animationDuration={1000}
            animationEasing="ease-out"
            dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Pessimistic band */}
          <Area
            type="monotone"
            dataKey="pessimistic"
            name={t('dashboard.mlZone.pessimistic', 'Pessimistic')}
            stroke="#F43F5E"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#projPessimistic)"
            animationDuration={1400}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-3">
        <p className="text-[11px] text-text-muted italic">
          {t('dashboard.mlZone.projectionRangeHint', 'Dotted lines indicate the likely range (min-max).')}
        </p>
        {yDomain[0] > 0 && (
          <span className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
            ⚠ {t('dashboard.mlZone.axisZoomed', 'Y-axis zoomed to data range')}
          </span>
        )}
      </div>
    </div>
  );
};
