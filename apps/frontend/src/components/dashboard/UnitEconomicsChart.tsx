import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Sparkles, Target, Users, Zap } from 'lucide-react';
import type { StrategicKpis } from '../../types/dashboard';
import { getCurrencySymbol } from '../../lib/format.utils';
import api from '../../lib/axios';

import { ChartHeader } from '../ui/ChartHeader';

interface UnitEconomicsChartProps {
  kpis?: StrategicKpis;
}

export const UnitEconomicsChart = ({ kpis }: UnitEconomicsChartProps) => {
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

  const cac = kpis?.cac ?? 0;
  const ltv = kpis?.ltv ?? 0;
  const ratio = cac > 0 ? ltv / cac : 0;

  // Payback period simulated from actual CAC and typical average margins (10% standard LTV)
  const paybackMonths = useMemo(() => {
    if (cac <= 0) return 0;
    // CAC divided by monthly contribution (we assume monthly contribution is LTV / 36 months average customer lifetime)
    const monthlyContribution = ltv / 36;
    if (monthlyContribution <= 0) return 12; // fallback
    return Math.min(36, cac / monthlyContribution);
  }, [cac, ltv]);

  const chartData = [
    { name: t('dashboard.kpis.cac', "Coût d'Acquisition (CAC)"), value: cac, fill: '#F43F5E' },
    { name: t('dashboard.kpis.ltv', 'Valeur à Vie (LTV)'), value: ltv, fill: '#00D1FF' }
  ];

  if (cac <= 0 && ltv <= 0) {
    return (
      <div className="chart-container flex flex-col items-center justify-center py-10 h-72">
        <Target className="w-8 h-8 text-text-muted/40 mb-3" />
        <p className="text-sm font-semibold text-text-muted">
          {t('dashboard.charts.unitEconomicsNoData', 'Données CAC & LTV non disponibles dans ce lot.')}
        </p>
      </div>
    );
  }

  const progressPercentage = Math.min(100, (ratio / 3) * 100);

  const healthStatus = ratio >= 3 ? {
    label: t('dashboard.charts.healthExcellent', 'Excellent'),
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  } : ratio >= 2 ? {
    label: t('dashboard.charts.healthGood', 'Correct'),
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  } : {
    label: t('dashboard.charts.healthLow', 'Insuffisant'),
    colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="chart-container space-y-6">
      <ChartHeader
        title={t('dashboard.charts.unitEconomicsTitle', 'Analyse Économique Unitaire (LTV:CAC)')}
        subtitle={t('dashboard.charts.unitEconomicsSubtitle', "Rentabilité client comparant le coût d'acquisition à la valeur générée.")}
        icon={Target}
        iconClassName="w-4.5 h-4.5 text-brand"
      >
        {/* Dynamic Telemetry Badges */}
        <div className="flex gap-3">
          <div className="group bg-surface/40 hover:bg-surface/70 border border-border/50 rounded-2xl p-2.5 px-4 text-left backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] cursor-default flex items-center gap-3">
            <div className={`p-2 rounded-xl ${ratio >= 3 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block">{t('dashboard.charts.ltvCacRatio', 'LTV:CAC Ratio')}</span>
              <span className={`text-base font-bold font-mono ${ratio >= 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ratio.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="group bg-surface/40 hover:bg-surface/70 border border-border/50 rounded-2xl p-2.5 px-4 text-left backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,209,255,0.05)] cursor-default flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block">{t('dashboard.charts.paybackPeriod', 'Payback Period')}</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {paybackMonths.toFixed(1)} <span className="text-xs font-normal text-text-muted">{t('dashboard.charts.monthsSymbol', 'mois')}</span>
              </span>
            </div>
          </div>
        </div>
      </ChartHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Analytics */}
        <div className="lg:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="cacGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#BE123C" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="ltvGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00D1FF" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.15} horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickFormatter={(v) => `${v.toLocaleString('fr-FR')} ${currencySymbol}`} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }} width={140} />
              <Tooltip
                formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} ${currencySymbol}`, '']}
                contentStyle={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
              />
              <Bar dataKey="value" barSize={24} radius={[0, 12, 12, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#cacGradient)' : 'url(#ltvGradient)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* IA Smart Insight */}
        <div className="relative bg-gradient-to-br from-elevated/40 via-elevated/20 to-surface/40 border border-border/50 rounded-2xl p-5 flex flex-col justify-between text-left backdrop-blur-md shadow-lg overflow-hidden group">
          {/* Subtle animated background glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-brand/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                {t('dashboard.charts.aiDiagnosis', 'Diagnostic IA')}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthStatus.colorClass}`}>
                {healthStatus.label}
              </span>
            </div>
            
            <p className="text-xs font-medium text-text-secondary leading-relaxed">
              {ratio >= 3 ? (
                t('dashboard.charts.unitEconomicsHealthy', "Votre ratio LTV:CAC de {{ratio}}x est excellent (supérieur au standard de 3x). L'acquisition client est hautement rentable et vous pouvez accélérer vos dépenses marketing sereinement.", { ratio: ratio.toFixed(1) })
              ) : (
                t('dashboard.charts.unitEconomicsWarning', "Votre ratio LTV:CAC de {{ratio}}x est inférieur au seuil recommandé de 3x. Nous vous conseillons d'optimiser vos canaux d'acquisition comptables ou d'accroître la valeur à vie via des stratégies de ventes croisées.", { ratio: ratio.toFixed(1) })
              )}
            </p>

            {/* Health Meter */}
            <div className="space-y-2 pt-1 border-t border-border/20">
              <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase tracking-wider">
                <span>Niveau de rentabilité</span>
                <span>{ratio.toFixed(1)}x / 3x</span>
              </div>
              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-border/10">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${ratio >= 3 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : ratio >= 2 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] text-text-muted font-bold pt-4">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" style={{ animationDuration: '3s' }} />
            {t('dashboard.charts.diagnosedLive', 'Calculé en temps réel')}
          </div>
        </div>
      </div>
    </div>
  );
};
