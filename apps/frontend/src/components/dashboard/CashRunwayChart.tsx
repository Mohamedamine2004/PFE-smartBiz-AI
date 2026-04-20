import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Activity, Clock } from 'lucide-react';
import type { ChartDataPoint } from '../../types/dashboard';
import { getMetricNumber } from '../../lib/format.utils';
import { ChartHeader } from '../ui/ChartHeader';

interface CashRunwayChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label, infiniteText, monthsText }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip min-w-[200px]">
      <p className="tooltip-label border-b border-white/10 pb-2 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => {
        // Handle special display for the runway months
        const isRunway = entry.dataKey === 'runwayMonths';
        const displayValue = isRunway
          ? entry.value >= 999
            ? infiniteText
            : `${entry.value.toFixed(1)} ${monthsText}`
          : typeof entry.value === 'number'
            ? entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : entry.value;

        return (
          <div key={i} className="tooltip-row py-0.5">
            <div className="flex items-center gap-2">
              <div className="tooltip-dot" style={{ background: entry.color }} />
              <span className="tooltip-name">{entry.name}</span>
            </div>
            <span className={`tooltip-value ${isRunway ? 'font-bold text-white' : ''}`}>
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const CashRunwayChart = ({ data }: CashRunwayChartProps) => {
  const { t } = useTranslation();
  const safeData = data || [];


  const chartData = useMemo(() => {
    return safeData.map((d) => {
      const balance = getMetricNumber(d as Record<string, unknown>, 'Ending_Cash_Balance');
      const burn = getMetricNumber(d as Record<string, unknown>, 'Net_Cash_Burn');
      // If burn is positive (generating cash), runway is infinite (we'll cap at 999 for graphing)
      // If burn is 0, also infinite
      const runwayMonths = (burn >= 0) ? 999 : Math.abs(balance / burn);

      return {
        period: String(d.period || ''),
        cashBalance: balance,
        burn: burn,
        runwayMonths: runwayMonths,
      };
    });
  }, [safeData]);

  // Extract latest metrics for embedded KPI cards
  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const currentRunway = latestData?.runwayMonths ?? 0;

  const getRunwayStatusColor = (months: number) => {
    if (months >= 999) return 'text-emerald-400';
    if (months > 12) return 'text-emerald-400';
    if (months > 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="chart-container">
      {/* Header with embedded KPI */}
      <ChartHeader
        title={t('dashboard.charts.cashRunwayTitle', 'Cash Runway Analysis')}
        subtitle={t('dashboard.charts.cashRunwaySubtitle', 'Survival metric based on cash balance vs burn rate')}
      >

        {/* Embedded KPI Badge */}
        {latestData && (
          <div className="flex items-center gap-4 bg-black/20 dark:bg-black/40 border border-white/5 rounded-xl p-3 px-4 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                  {t('dashboard.charts.currentRunway', 'Current Runway')}
                </p>
                <p className={`text-xl font-bold tabular-nums tracking-tight ${getRunwayStatusColor(currentRunway)}`}>
                  {currentRunway >= 999
                    ? t('dashboard.charts.infinite', 'Infinite')
                    : `${currentRunway.toFixed(1)} ${t('dashboard.charts.months', 'Mo.')}`}
                </p>
              </div>
            </div>

            <div className="w-px h-10 bg-white/10 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                  {t('dashboard.charts.monthlyBurn', 'Monthly Burn')}
                </p>
                <p className="text-lg font-bold tabular-nums tracking-tight text-text-primary">
                  {Math.abs(latestData.burn).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </ChartHeader>

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
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
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
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />

            <Tooltip
              content={
                <CustomTooltip
                  infiniteText={t('dashboard.charts.infiniteCashFlow')}
                  monthsText={t('dashboard.charts.months', 'Months')}
                />
              }
              cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '5 5' }}
            />

            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-sans)', paddingTop: '20px' }}
              iconType="circle"
              iconSize={8}
            />

            {/* Zero Reference Line for Burn */}
            <ReferenceLine y={0} yAxisId="right" stroke="var(--border-color)" strokeWidth={1} strokeDasharray="3 3" />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cashBalance"
              name={t('dashboard.charts.metrics.endingCashBalance', 'Cash Balance')}
              stroke="#6366F1"
              strokeWidth={3}
              fill="url(#balanceGrad)"
              activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="burn"
              name={t('dashboard.charts.metrics.netCashBurn', 'Net Burn')}
              stroke="#F43F5E"
              strokeWidth={2}
              dot={{ r: 3, fill: '#F43F5E', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#F43F5E', stroke: '#FDA4AF', strokeWidth: 3 }}
              animationDuration={1500}
              animationBegin={400}
            />

            {/* A hidden line just to feed the tooltip with runway calculation */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="runwayMonths"
              name={t('dashboard.charts.metrics.runwayMonths', 'Runway (Months)')}
              stroke="transparent"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
