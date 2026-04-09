import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';

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

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getMetricValue = (point: ChartDataPoint, candidateKeys: string[]): number | null => {
    const entries = Object.entries(point);
    for (const candidate of candidateKeys) {
      const exact = point[candidate];
      if (typeof exact === 'number') return exact;
      if (typeof exact === 'string' && exact.trim() !== '') {
        const parsed = Number(exact);
        if (!Number.isNaN(parsed)) return parsed;
      }
      const normalizedCandidate = normalizeKey(candidate);
      const matched = entries.find(([key]) => normalizeKey(key) === normalizedCandidate)?.[1];
      if (typeof matched === 'number') return matched;
      if (typeof matched === 'string' && matched.trim() !== '') {
        const parsed = Number(matched);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
    return null;
  };

  const chartData = safeData.map((d) => ({
    period: String(d.period || ''),
    newCustomers: getMetricValue(d, [
      'New_Customers_Acquired', 'New_Customers', 'newCustomers', 'customers',
    ]),
    totalRetention: getMetricValue(d, [
      'Customers_Churned', 'Retention_Rate', 'Total_Retention',
      'totalRetention', 'retentionRate', 'Retention',
    ]),
  }));

  return (
    <div className="chart-container">
      <div className="mb-5 space-y-1 text-left">
        <h3
          className="text-lg font-bold text-text-primary tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('dashboard.charts.retentionTitle', 'Acquisition & Retention')}
        </h3>
        <p className="text-xs font-medium text-text-muted">
          {t('dashboard.charts.retentionSubtitle', 'Historical cohort performance drawn from the live database')}
        </p>
      </div>

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
