import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Target, Globe, PieChart, TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';
import api from '../../lib/axios';
import type { StrategicKpis } from '../../types/dashboard';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { formatWithSymbol } from '../../lib/format.utils';

interface StrategicKpisGridProps {
  data?: StrategicKpis;
}

/* ── Individual KPI Card ── */
const KpiCard = ({ kpi, index }: { kpi: KpiItem; index: number }) => {
  const Icon = kpi.icon;
  const AlertIcon = kpi.alert?.icon;
  const animatedNum = useAnimatedValue(kpi.rawValue ?? 0);

  const displayValue = kpi.isPercentage
    ? `${animatedNum.toFixed(1)}%`
    : kpi.formatFn ? kpi.formatFn(animatedNum)
    : kpi.value;

  return (
    <div
      className="dashboard-card group p-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Gradient background blob */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${kpi.color} rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700`}
      />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top row: icon + badge */}
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-xl ${kpi.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
          </div>

          {kpi.alert && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-colors
                ${kpi.alert.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : kpi.alert.type === 'warning'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
            >
              {AlertIcon && <AlertIcon className="w-3 h-3" />}
              {kpi.alert.text}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1 text-left">
          <h4
            className="text-2xl font-bold text-text-primary tracking-tight tabular-nums"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayValue}
          </h4>
          <p className="text-xs font-medium text-text-muted leading-tight">
            {kpi.label}
          </p>
        </div>
      </div>
    </div>
  );
};

interface KpiAlert {
  type: string;
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface KpiItem {
  label: string;
  value: string;
  rawValue?: number;
  isPercentage?: boolean;
  formatFn?: (val: number) => string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  iconBg: string;
  alert?: KpiAlert;
}

export const StrategicKpisGrid = ({ data }: StrategicKpisGridProps) => {
  const { t } = useTranslation();
  const [currencySymbol, setCurrencySymbol] = useState('€');

  useEffect(() => {
    api.get('/company/profile')
      .then((res) => {
        if (res.data?.currency) {
          setCurrencySymbol(res.data.currency);
        }
      })
      .catch(() => {});
  }, []);

  const formatWithCurrency = (value: number) => formatWithSymbol(value, currencySymbol);

  const cacVal = data?.cac || 0;
  const ltvVal = data?.ltv || 0;
  const ltvCacRatio = cacVal > 0 ? ltvVal / cacVal : 0;

  const kpis: KpiItem[] = [
    {
      label: t('dashboard.kpis.cac', "Coût d'acquisition (CAC)"),
      value: data?.cac != null ? formatWithCurrency(data.cac) : 'NaN',
      rawValue: data?.cac ?? 0,
      formatFn: formatWithCurrency,
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/0',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border border-cyan-500/20',
      alert: cacVal > 500
        ? { type: 'warning', text: t('dashboard.kpis.highCac'), icon: AlertTriangle }
        : undefined,
    },
    {
      label: t('dashboard.kpis.ltv', 'Valeur vie client (LTV)'),
      value: data?.ltv != null ? formatWithCurrency(data.ltv) : 'NaN',
      rawValue: data?.ltv ?? 0,
      formatFn: formatWithCurrency,
      icon: Target,
      color: 'from-[#00D1FF]/20 to-blue-500/0',
      iconColor: 'text-[#00D1FF]',
      iconBg: 'bg-[#00D1FF]/10 border border-[#00D1FF]/20',
      alert: ltvCacRatio > 0
        ? {
            type: ltvCacRatio >= 3 ? 'success' : 'warning',
            text: `Ratio LTV:CAC = ${ltvCacRatio.toFixed(1)}x`,
            icon: ltvCacRatio >= 3 ? TrendingUp : AlertTriangle,
          }
        : undefined,
    },
    {
      label: t('dashboard.kpis.tam', 'Marché adressable (TAM)'),
      value: data?.tam != null ? formatWithCurrency(data.tam) : 'NaN',
      rawValue: data?.tam ?? 0,
      formatFn: formatWithCurrency,
      icon: Globe,
      color: 'from-indigo-500/20 to-blue-500/0',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border border-indigo-500/20',
      alert: { type: 'neutral', text: t('dashboard.kpis.stableGrowth'), icon: TrendingUp },
    },
    {
      label: t('dashboard.kpis.marketShare', 'Part de marché'),
      value: data?.marketShare != null ? `${data.marketShare.toFixed(1)}%` : 'NaN',
      rawValue: data?.marketShare ?? 0,
      isPercentage: true,
      icon: PieChart,
      color: 'from-emerald-500/20 to-teal-500/0',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
      alert: data?.marketShare && data.marketShare < 5
        ? { type: 'warning', text: t('dashboard.kpis.toDevelop'), icon: TrendingDown }
        : { type: 'success', text: t('dashboard.kpis.strongPosition'), icon: TrendingUp },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
      {kpis.map((kpi, i) => (
        <KpiCard key={i} kpi={kpi} index={i} />
      ))}
    </div>
  );
};
