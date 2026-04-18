import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';
import { ChartHeader } from '../ui/ChartHeader';
import { getMetricByAliases } from '../../lib/format.utils';

interface CustomerRetentionChartProps {
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
              : entry.value ?? 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CustomerRetentionChart = ({ data }: CustomerRetentionChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];
  const chartData = safeData.map((d) => ({
    period: String(d.period || ''),
    newCustomers: getMetricByAliases(d as Record<string, unknown>, [
      'New_Customers_Acquired', 'New_Customers', 'newCustomers', 'customers',
    ]),
    totalRetention: getMetricByAliases(d as Record<string, unknown>, [
      'Customers_Churned', 'Retention_Rate', 'Total_Retention',
      'totalRetention', 'retentionRate', 'Retention',
    ]),
  }));

  return (
    <div className="chart-container">
      <ChartHeader
        title={t('dashboard.charts.retentionTitle', 'Acquisition & Retention')}
        subtitle={t('dashboard.charts.retentionSubtitle', 'Historical cohort performance drawn from the live database')}
      />

      {safeData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.charts.noData', 'No historical data available yet.')}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00D1FF" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#00D1FF" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="indigoLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={1} />
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="newCustomers"
              name={t('dashboard.charts.newCustomers', 'New Customers')}
              stroke="url(#cyanLineGrad)"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#00D1FF', strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: '#00D1FF',
                stroke: '#67E8F9',
                strokeWidth: 3,
                strokeOpacity: 0.4,
              }}
              animationDuration={1000}
              animationEasing="ease-out"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="totalRetention"
              name={t('dashboard.charts.totalRetention', 'Total Retention')}
              stroke="url(#indigoLineGrad)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: '#6366F1',
                stroke: '#A5B4FC',
                strokeWidth: 3,
                strokeOpacity: 0.4,
              }}
              animationDuration={1000}
              animationEasing="ease-out"
              animationBegin={300}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
