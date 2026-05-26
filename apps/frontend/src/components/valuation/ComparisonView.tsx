import { useTranslation } from 'react-i18next';
import { GitCompareArrows, Landmark, TrendingUp, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ValuationResult } from '../../types/valuation';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(v);

const METHOD_LABELS: Record<string, string> = {
  EV_EBITDA: 'valuation.methods.evEbitda',
  EV_REVENUE: 'valuation.methods.evRevenue',
  PE_RATIO: 'valuation.methods.peRatio',
  ASSET_BASED: 'valuation.methods.assetBased',
  GORDON_GROWTH: 'valuation.methods.gordonGrowth',
};

interface Props {
  primary: ValuationResult;
  compare: ValuationResult;
}

export const ComparisonView = ({ primary, compare }: Props) => {
  const { t } = useTranslation();

  const diff = compare.equityValue - primary.equityValue;
  const diffPct =
    primary.equityValue !== 0
      ? ((diff / Math.abs(primary.equityValue)) * 100).toFixed(1)
      : '—';

  // Prepare chart data
  const chartData = [
    {
      name: t(METHOD_LABELS[primary.method] ?? primary.method).replace('Multiples ', ''),
      'Valeur de l\'Entreprise (EV)': primary.enterpriseValue ?? 0,
      'Valeur des Capitaux Propres (Equity)': primary.equityValue,
    },
    {
      name: t(METHOD_LABELS[compare.method] ?? compare.method).replace('Multiples ', ''),
      'Valeur de l\'Entreprise (EV)': compare.enterpriseValue ?? 0,
      'Valeur des Capitaux Propres (Equity)': compare.equityValue,
    },
  ];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 backdrop-blur-md border border-border/80 p-3.5 rounded-xl shadow-xl text-left">
          <p className="text-xs font-bold text-text-primary mb-2 border-b border-border/30 pb-1">
            {payload[0].payload.name}
          </p>
          {payload.map((p: any) => {
            if (p.value === 0 && p.name.includes('EV')) return null;
            return (
              <div key={p.name} className="flex items-center gap-4 justify-between text-xs font-semibold py-1">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name} :
                </span>
                <span className="font-mono text-text-primary font-bold">{fmt(p.value)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card !p-6 space-y-6 border border-border bg-surface/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-secondary animate-pulse" />
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            {t('valuation.compare.title', 'Analyse Comparative Mutli-Méthodes')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold bg-surface border border-border/30 px-2 py-0.5 rounded-lg">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Matrice Recharts</span>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-text-muted-rgb), 0.15)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-muted)" 
              fontSize={11} 
              fontWeight={600}
              tickLine={false} 
            />
            <YAxis 
              stroke="var(--color-text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
            />
            <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--color-brand-rgb), 0.05)' }} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconSize={10}
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}
            />
            <Bar 
              dataKey="Valeur des Capitaux Propres (Equity)" 
              fill="#8B5CF6" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={48}
            />
            <Bar 
              dataKey="Valeur de l'Entreprise (EV)" 
              fill="#00D1FF" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side numerical table */}
      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface/50 border-b border-border/60">
              <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider py-2.5 px-4">
                Paramètre de Valorisation
              </th>
              <th className="text-left text-xs font-bold text-brand uppercase tracking-wider py-2.5 px-4">
                {t(METHOD_LABELS[primary.method] ?? primary.method)}
              </th>
              <th className="text-left text-xs font-bold text-secondary uppercase tracking-wider py-2.5 px-4">
                {t(METHOD_LABELS[compare.method] ?? compare.method)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {/* Enterprise Value */}
            <tr className="hover:bg-surface/30 transition-colors">
              <td className="py-3 px-4 font-semibold text-text-secondary flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-text-muted" />
                {t('valuation.enterpriseValue')}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-text-primary font-bold">
                {primary.enterpriseValue !== null
                  ? fmt(primary.enterpriseValue)
                  : '—'}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-text-primary font-bold">
                {compare.enterpriseValue !== null
                  ? fmt(compare.enterpriseValue)
                  : '—'}
              </td>
            </tr>
            {/* Equity Value */}
            <tr className="hover:bg-surface/30 transition-colors">
              <td className="py-3 px-4 font-semibold text-text-secondary flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
                {t('valuation.equityValue')}
              </td>
              <td className="py-3 px-4 font-mono text-sm font-bold text-brand">
                {fmt(primary.equityValue)}
              </td>
              <td className="py-3 px-4 font-mono text-sm font-bold text-secondary">
                {fmt(compare.equityValue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Difference Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {t('valuation.compare.difference', 'Écart Relatif des Capitaux Propres')}
        </span>
        <span
          className={`text-sm font-bold font-mono px-3 py-1 rounded-full border ${
            diff > 0 
              ? 'text-success bg-success/10 border-success/20' 
              : diff < 0 
                ? 'text-error bg-error/10 border-error/20' 
                : 'text-text-secondary bg-surface border-border/40'
          }`}
        >
          {diff >= 0 ? '+' : ''}
          {fmt(diff)} ({diffPct}%)
        </span>
      </div>
    </div>
  );
};
