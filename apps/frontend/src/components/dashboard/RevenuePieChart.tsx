import { useTranslation } from 'react-i18next';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';

interface RevenuePieChartProps {
  data: ChartDataPoint[];
}

export const RevenuePieChart = ({ data }: RevenuePieChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];

  const getMetricValue = (point: ChartDataPoint, candidateKey: string): number => {
    const val = point[candidateKey];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = Number(val);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  };

  // Aggregate metrics across ALL periods for a summary pie chart
  const totalPayroll = safeData.reduce((sum, d) => sum + getMetricValue(d, 'Payroll_Expenses'), 0);
  const totalMarketing = safeData.reduce((sum, d) => sum + getMetricValue(d, 'Marketing_Spend'), 0);

  // Calculate remaining ops to show a realistic pie
  const totalOps = safeData.reduce((sum, d) => sum + getMetricValue(d, 'Operating_Expenses_Total'), 0);
  const otherOps = Math.max(0, totalOps - (totalPayroll + totalMarketing));

  const seriesData = [
    { id: 0, value: totalPayroll, label: t('dashboard.charts.metrics.payrollExpenses', 'Payroll'), color: '#3B82F6' },
    { id: 1, value: totalMarketing, label: t('dashboard.charts.metrics.marketingSpend', 'Marketing'), color: '#8B5CF6' },
    { id: 2, value: otherOps, label: t('dashboard.charts.metrics.otherOps', 'Other Expenses'), color: '#E5E7EB' },
  ].filter(item => item.value > 0);

  return (
    <div className="card w-full">
      <div className="mb-4 space-y-1 text-left">
        <h3 className="text-2xl font-extrabold text-text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          {t('dashboard.charts.expenseAllocation', 'Expenses Allocation')}
        </h3>
        <p className="text-sm font-medium text-text-muted">
          {t('dashboard.charts.expenseAllocationSubtitle', 'Distribution of operating expenses (Aggregated)')}
        </p>
      </div>

      {safeData.length === 0 || seriesData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-[#3c494e]/15 rounded-xl bg-surface">
          <p className="text-text-secondary text-sm font-medium">
            {t('dashboard.charts.noData', 'No historical data available yet.')}
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={seriesData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                stroke="transparent"
              >
                {seriesData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
