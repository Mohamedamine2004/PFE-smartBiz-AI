import { useTranslation } from 'react-i18next';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';
import { ChartHeader } from '../ui/ChartHeader';
import { getMetricByAliases } from '../../lib/format.utils';

interface TrendAnalysisChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip min-w-[200px]">
      <p className="tooltip-label border-b border-white/10 pb-2 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => {
        const isMargin = entry.dataKey === 'margin';
        const displayValue = isMargin
          ? `${entry.value.toFixed(1)}%`
          : entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 });

        return (
          <div key={i} className="tooltip-row py-0.5">
            <div className="flex items-center gap-2">
              <div className="tooltip-dot" style={{ background: entry.color }} />
              <span className="tooltip-name">{entry.name}</span>
            </div>
            <span className={`tooltip-value ${isMargin ? 'font-bold text-[#00D1FF]' : ''}`}>
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const TrendAnalysisChart = ({ data }: TrendAnalysisChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];


  const chartData = safeData.map((d) => {
    const rev = getMetricByAliases(d as Record<string, unknown>, ['Gross_Revenue', 'Revenue']);
    const exp = getMetricByAliases(d as Record<string, unknown>, ['Operating_Expenses_Total', 'Expenses']);
    const margin = rev > 0 ? ((rev - exp) / rev) * 100 : 0;

    return {
      period: String(d.period || ''),
      revenue: rev,
      margin: margin
    };
  });

  return (
    <div className="chart-container">
      <ChartHeader
        title={t('dashboard.charts.trendAnalysisTitle', 'Revenue & Margin Trends')}
        subtitle={t('dashboard.charts.trendAnalysisSubtitle', 'Gross volume vs relative profit margin evolution')}
      />

      {safeData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.charts.noData', 'No historical data available yet.')}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-color)', opacity: 0.1 }} />

            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '20px' }}
              iconType="circle"
              iconSize={8}
            />

            <Bar
              yAxisId="left"
              dataKey="revenue"
              name={t('dashboard.charts.metrics.grossRevenue', 'Gross Revenue')}
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
              barSize={32}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fillOpacity={entry.margin < 0 ? 0.3 : 1} />
              ))}
            </Bar>

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              name={t('dashboard.charts.metrics.profitMargin', 'Profit Margin (%)')}
              stroke="#00D1FF"
              strokeWidth={3}
              dot={{ r: 4, fill: '#00D1FF', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#00D1FF', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
              animationBegin={400}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
