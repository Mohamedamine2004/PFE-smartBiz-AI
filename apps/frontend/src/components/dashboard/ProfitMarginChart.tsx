import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';
import { ChartHeader } from '../ui/ChartHeader';
import { getMetricNumber } from '../../lib/format.utils';

interface ProfitMarginChartProps {
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

export const ProfitMarginChart = ({ data }: ProfitMarginChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];
  const chartData = safeData.map((d) => ({
    period: String(d.period || ''),
    netCashBurn: getMetricNumber(d as Record<string, unknown>, 'Net_Cash_Burn'),
  }));

  return (
    <div className="chart-container">
      <ChartHeader
        title={t('dashboard.charts.netCashBurn', 'Net Cash Burn')}
        subtitle={t('dashboard.charts.netCashBurnSubtitle', 'Monthly net cash burn trend')}
      />

      {safeData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.charts.noData', 'No historical data available yet.')}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashBurnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="netCashBurn"
              name={t('dashboard.charts.metrics.netCashBurn', 'Net Cash Burn')}
              stroke="#F59E0B"
              strokeWidth={2.5}
              fill="url(#cashBurnGradient)"
              dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: '#F59E0B',
                stroke: '#FDE68A',
                strokeWidth: 3,
                strokeOpacity: 0.4,
              }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
