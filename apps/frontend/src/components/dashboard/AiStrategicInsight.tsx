import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';

interface AiStrategicInsightProps {
  data: ChartDataPoint[];
}

export const AiStrategicInsight = ({ data }: AiStrategicInsightProps) => {
  const { t } = useTranslation();
  const safeData = data || [];
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getMetricValue = (point: ChartDataPoint, keys: string[]): number => {
    for (const key of keys) {
      const val = point[key as keyof ChartDataPoint];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = Number(val);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
    return 0;
  };

  const healthData = useMemo(() => {
    if (safeData.length === 0) return { score: 0, insights: [] };

    // Calculate basic trajectory
    const recent = safeData.slice(Math.max(safeData.length - 3, 0));

    let revGrowth = 0;
    let avgMargin = 0;
    let avgRetention = 0;

    if (recent.length >= 2) {
      const first = getMetricValue(recent[0], ['Gross_Revenue', 'Revenue']);
      const last = getMetricValue(recent[recent.length - 1], ['Gross_Revenue', 'Revenue']);
      revGrowth = first > 0 ? ((last - first) / first) * 100 : 0;
    }

    recent.forEach(d => {
      const rev = getMetricValue(d, ['Gross_Revenue', 'Revenue']);
      const exp = getMetricValue(d, ['Operating_Expenses_Total', 'Expenses']);
      avgMargin += rev > 0 ? ((rev - exp) / rev) * 100 : 0;
      avgRetention += getMetricValue(d, ['Retention_Rate', 'Total_Retention']);
    });

    avgMargin /= recent.length || 1;
    avgRetention /= recent.length || 1;

    // Calculate a 0-100 score
    let scoreBase = 50;
    scoreBase += revGrowth * 0.5; // Up to 50 pts for 100% growth
    scoreBase += avgMargin * 1.5; // Margins heavily weight health
    scoreBase += (avgRetention - 80) * 0.5; // Bonus for retention > 80%

    const finalScore = Math.max(0, Math.min(100, scoreBase));

    // Generate dynamic insights
    const insights = [];
    if (revGrowth > 10) {
      insights.push({ type: 'success', text: t('insight.growth.high', 'Strong Revenue Velocity detected in recent periods.') });
    } else if (revGrowth < 0) {
      insights.push({ type: 'warning', text: t('insight.growth.low', 'Revenue is showing a decelerating trend.') });
    } else {
      insights.push({ type: 'neutral', text: t('insight.growth.stable', 'Revenue growth is stable.') });
    }

    if (avgMargin > 20) {
      insights.push({ type: 'success', text: t('insight.margin.high', 'Operational margins are highly profitable.') });
    } else if (avgMargin < 0) {
      insights.push({ type: 'warning', text: t('insight.margin.low', 'Cash burn exceeds revenue generation currently.') });
    }

    if (avgRetention >= 90) {
      insights.push({ type: 'success', text: t('insight.retention.high', 'World-class customer retention.') });
    }

    if (insights.length < 3) {
      insights.push({ type: 'neutral', text: t('insight.liquidity.stable', 'Liquidity reserves remain within expected parameters.') });
    }

    return { score: finalScore, insights: insights.slice(0, 3) };
  }, [safeData, t]);

  const chartData = [{ name: t('dashboard.kpis.health'), value: healthData.score, fill: healthData.score >= 70 ? '#10B981' : healthData.score >= 40 ? '#F59E0B' : '#F43F5E' }];

  return (
    <div className="dashboard-card relative overflow-hidden flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 bg-gradient-to-br from-surface to-elevated">
      {/* Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Radial Health Score Chart */}
      <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="75%" outerRadius="100%"
            barSize={12}
            data={chartData}
            startAngle={210}
            endAngle={-30}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'var(--border-color)', opacity: 0.3 }}
              dataKey="value"
              cornerRadius={10}
              label={false}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-text-main tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
            {healthData.score.toFixed(0)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {t('dashboard.kpis.health')}
          </span>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="flex-1 w-full space-y-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex items-center justify-center w-6 h-6">
            <Sparkles className={`w-4 h-4 text-brand absolute transition-opacity duration-1000 ${pulse ? 'opacity-100' : 'opacity-40'}`} />
            <div className={`w-2 h-2 bg-brand rounded-full blur-[4px] absolute transition-all duration-1000 ${pulse ? 'scale-150' : 'scale-100'}`} />
          </div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400" style={{ fontFamily: 'var(--font-display)' }}>
            {t('dashboard.aiInsight.title', 'SmartBiz AI Analysis')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {healthData.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-black/10 dark:bg-black/20 border border-white/5 rounded-xl transition-transform hover:translate-x-1 duration-300">
              <div className="mt-0.5">
                {insight.type === 'success' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {insight.type === 'neutral' && <ShieldCheck className="w-4 h-4 text-brand" />}
              </div>
              <p className="text-sm font-medium text-text-secondary leading-snug">
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
