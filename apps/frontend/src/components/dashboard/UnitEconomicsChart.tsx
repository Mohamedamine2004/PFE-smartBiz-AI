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

  return (
    <div className="chart-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-brand" />
            {t('dashboard.charts.unitEconomicsTitle', 'Analyse Économique Unitaire (LTV:CAC)')}
          </h3>
          <p className="text-xs text-text-muted">
            {t('dashboard.charts.unitEconomicsSubtitle', "Rentabilité client comparant le coût d'acquisition à la valeur générée.")}
          </p>
        </div>

        {/* Dynamic Telemetry Badges */}
        <div className="flex gap-3">
          <div className="bg-black/20 dark:bg-black/40 border border-border/40 rounded-xl p-2.5 px-3.5 text-left">
            <span className="text-[9px] uppercase font-bold text-text-muted block">LTV:CAC Ratio</span>
            <span className={`text-base font-bold font-mono ${ratio >= 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ratio.toFixed(1)}x
            </span>
          </div>
          <div className="bg-black/20 dark:bg-black/40 border border-border/40 rounded-xl p-2.5 px-3.5 text-left">
            <span className="text-[9px] uppercase font-bold text-text-muted block">Payback Period</span>
            <span className="text-base font-bold font-mono text-[#00D1FF]">
              {paybackMonths.toFixed(1)} {t('dashboard.charts.monthsSymbol', 'mois')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Analytics */}
        <div className="lg:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickFormatter={(v) => `${v.toLocaleString('fr-FR')} ${currencySymbol}`} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 10, fontWeight: 700 }} width={120} />
              <Tooltip
                formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} ${currencySymbol}`, '']}
                contentStyle={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
              />
              <Bar dataKey="value" barSize={32} radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* IA Smart Insight */}
        <div className="bg-elevated/30 border border-border/40 rounded-2xl p-5 flex flex-col justify-between text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand animate-pulse" />
              {t('dashboard.charts.aiDiagnosis', 'Diagnostic IA')}
            </div>
            
            <p className="text-xs font-medium text-text-secondary leading-relaxed">
              {ratio >= 3 ? (
                t('dashboard.charts.unitEconomicsHealthy', "Votre ratio LTV:CAC de {{ratio}}x est excellent (supérieur au standard de 3x). L'acquisition client est hautement rentable et vous pouvez accélérer vos dépenses marketing sereinement.", { ratio: ratio.toFixed(1) })
              ) : (
                t('dashboard.charts.unitEconomicsWarning', "Votre ratio LTV:CAC de {{ratio}}x est inférieur au seuil recommandé de 3x. Nous vous conseillons d'optimiser vos canaux d'acquisition comptables ou d'accroître la valeur à vie via des stratégies de ventes croisées.", { ratio: ratio.toFixed(1) })
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] text-text-muted font-bold border-t border-border/30 pt-3">
            <Zap className="w-3.5 h-3.5 text-[#00D1FF]" />
            {t('dashboard.charts.diagnosedLive', 'Calculé en temps réel')}
          </div>
        </div>
      </div>
    </div>
  );
};
