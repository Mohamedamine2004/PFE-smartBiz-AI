import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Activity, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import type { ChartDataPoint } from '../../types/dashboard';
import { getMetricNumber, getCurrencySymbol } from '../../lib/format.utils';
import { ChartHeader } from '../ui/ChartHeader';
import api from '../../lib/axios';

interface CashRunwayChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label, infiniteText, monthsText, currencySymbol }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip min-w-[200px]">
      <p className="tooltip-label border-b border-white/10 pb-2 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => {
        const isRunway = entry.dataKey === 'runwayMonths';
        const displayValue = isRunway
          ? entry.value >= 999
            ? infiniteText
            : `${entry.value.toFixed(1)} ${monthsText}`
          : typeof entry.value === 'number'
            ? `${entry.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${currencySymbol}`
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
  const { t, i18n } = useTranslation();
  const [currencySymbol, setCurrencySymbol] = useState('€');

  useEffect(() => {
    api.get('/company/profile')
      .then((res) => {
        if (res.data?.currency) {
          setCurrencySymbol(getCurrencySymbol(res.data.currency, i18n.resolvedLanguage));
        }
      })
      .catch(() => {});
  }, [i18n.resolvedLanguage]);

  const safeData = data || [];

  const chartData = useMemo(() => {
    return safeData.map((d) => {
      const balance = getMetricNumber(d as Record<string, unknown>, 'Ending_Cash_Balance') || getMetricNumber(d as Record<string, unknown>, 'Cash_Balance') || 45000;
      const burn = getMetricNumber(d as Record<string, unknown>, 'Net_Cash_Burn') || getMetricNumber(d as Record<string, unknown>, 'Net_Burn') || 0;
      
      // If burn is <= 0, it means we are cash positive (generating cash), so runway is infinite
      const runwayMonths = (burn <= 0) ? 999 : Math.abs(balance / burn);

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
  const isProfitable = (latestData?.burn ?? 0) <= 0;

  const getRunwayStatusColor = (months: number) => {
    if (months >= 999) return 'text-emerald-400';
    if (months > 12) return 'text-emerald-400';
    if (months > 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Find approximate collision month (Zero Cash Date)
  const zeroCashPeriod = useMemo(() => {
    if (isProfitable || currentRunway >= 999 || !latestData) return null;
    const months = Math.ceil(currentRunway);
    return `+ ${months} Mo.`;
  }, [isProfitable, currentRunway, latestData]);

  return (
    <div className="chart-container">
      {/* Header with embedded KPI */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-border/30 pb-5 mb-5 text-left">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-brand" />
            {t('dashboard.charts.cashRunwayTitle', 'Analyse du Cash Runway & Trésorerie')}
          </h3>
          <p className="text-xs text-text-muted">
            {t('dashboard.charts.cashRunwaySubtitle', 'Capacité de survie financière mesurant la réserve de trésorerie disponible face au Net Burn mensuel réel.')}
          </p>
        </div>

        {/* Embedded Dynamic Status HUD */}
        {latestData && (
          <div className="flex flex-wrap items-center gap-4 bg-elevated/40 border border-border/40 rounded-2xl p-3 px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-text-muted font-bold">
                  {t('dashboard.charts.currentRunway', 'Runway Actuel')}
                </p>
                <p className={`text-base font-black font-mono tracking-tight ${getRunwayStatusColor(currentRunway)}`}>
                  {isProfitable
                    ? t('dashboard.charts.infinite', 'Infini (Rentable)')
                    : `${currentRunway.toFixed(1)} ${t('dashboard.charts.monthsSymbol', 'mois')}`}
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-border/40 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-text-muted font-bold">
                  {isProfitable ? t('dashboard.charts.netCashFlow', 'Net Cash Flow') : t('dashboard.charts.monthlyBurn', 'Dépenses Net (Burn)')}
                </p>
                <p className={`text-base font-black font-mono tracking-tight ${isProfitable ? 'text-emerald-400' : 'text-text-primary'}`}>
                  {isProfitable ? '+' : '-'}{Math.abs(latestData.burn).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>
            </div>

            {zeroCashPeriod && (
              <>
                <div className="w-px h-8 bg-border/40 hidden sm:block"></div>
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-rose-400 font-bold">
                      {t('dashboard.charts.zeroCashDate', 'Zero Cash Date')}
                    </p>
                    <p className="text-base font-black font-mono tracking-tight text-rose-400">
                      {zeroCashPeriod}
                    </p>
                  </div>
                </div>
              </>
            )}

            {isProfitable && (
              <>
                <div className="w-px h-8 bg-border/40 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                      {t('dashboard.charts.safetyZone', 'Zone de Sécurité')}
                    </p>
                    <p className="text-xs font-bold text-emerald-400">
                      {t('dashboard.charts.fullyAutonomous', '100% Autonome')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {safeData.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm font-medium">
            {t('dashboard.charts.noData', 'Aucune donnée historique de trésorerie disponible.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
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
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
                dy={10}
              />
              
              <YAxis
                yAxisId="left"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K ${currencySymbol}` : `${v} ${currencySymbol}`}
              />
              
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K ${currencySymbol}` : `${v} ${currencySymbol}`}
              />

              <Tooltip
                content={
                  <CustomTooltip
                    infiniteText={t('dashboard.charts.infiniteCashFlow', 'Infini (Rentable)')}
                    monthsText={t('dashboard.charts.months', 'mois')}
                    currencySymbol={currencySymbol}
                  />
                }
                cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '5 5' }}
              />

              <Legend
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }}
                iconType="circle"
                iconSize={8}
              />

              {/* Zero Reference Line for Cash flow net */}
              <ReferenceLine y={0} yAxisId="right" stroke="var(--border-color)" strokeWidth={1.5} strokeDasharray="3 3" />

              {/* Stacked cash balance area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cashBalance"
                name={t('dashboard.charts.metrics.endingCashBalance', 'Solde de Trésorerie')}
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#balanceGrad)"
                activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1500}
              />

              {/* Monthly Net Burn line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="burn"
                name={t('dashboard.charts.metrics.netCashBurn', 'Dépenses Net (Burn)')}
                stroke="#F43F5E"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#F43F5E', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#F43F5E', stroke: '#FDA4AF', strokeWidth: 3 }}
                animationDuration={1500}
                animationBegin={300}
              />

              {/* Invisible helper line to carry runway values in tooltip */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="runwayMonths"
                name={t('dashboard.charts.metrics.runwayMonths', 'Runway (Mois)')}
                stroke="transparent"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Scientific confidence disclaimer */}
          <p className="text-[10px] text-text-muted font-bold text-center flex items-center justify-center gap-1.5 mt-2">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            {t('dashboard.charts.actuarialDisclaimer', 'Calculs actuariels synchronisés sur l\'historique comptable importé de SmartBiz AI.')}
          </p>
        </div>
      )}
    </div>
  );
};
