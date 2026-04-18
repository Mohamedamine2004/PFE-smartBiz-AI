import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';
import { ChartHeader } from '../ui/ChartHeader';
import { getMetricByAliases } from '../../lib/format.utils';

interface RevenueExpensesChartProps {
  data: ChartDataPoint[];
}

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
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
              ? entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 })
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const RevenueExpensesChart = ({ data }: RevenueExpensesChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');


  const chartData = safeData.map((d) => ({
    period: String(d.period || ''),
    revenue: getMetricByAliases(d as Record<string, unknown>, ['Gross_Revenue', 'Revenue', 'revenue']),
    expenses: getMetricByAliases(d as Record<string, unknown>, ['Operating_Expenses_Total', 'Expenses', 'expenses']),
  }));

  return (
    <div className="chart-container">
      <ChartHeader
        title={t('dashboard.charts.revenue', 'Revenue & Expenses')}
        subtitle={t('dashboard.charts.revenueSubtitle', 'Compare your generated revenue against operational expenses')}
      >
        <div className="flex items-center bg-elevated border border-border rounded-lg p-1">
          <button
            onClick={() => setChartMode('grouped')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartMode === 'grouped' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.charts.modeGrouped', 'Grouped')}
          </button>
          <button
            onClick={() => setChartMode('stacked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartMode === 'stacked' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.charts.modeStacked', 'Stacked')}
          </button>
        </div>
      </ChartHeader>

      {safeData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.charts.noData', 'No historical data available yet.')}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                <stop offset="100%" stopColor="#E11D48" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-color)', opacity: 0.15 }} />
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="revenue"
              name={t('dashboard.charts.metrics.grossRevenue', 'Gross Revenue')}
              fill="url(#revenueGradient)"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="expenses"
              name={t('dashboard.charts.metrics.operatingExpensesTotal', 'Operating Expenses')}
              fill="url(#expensesGradient)"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={chartMode === 'stacked' ? [6, 6, 0, 0] : [6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={200}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
