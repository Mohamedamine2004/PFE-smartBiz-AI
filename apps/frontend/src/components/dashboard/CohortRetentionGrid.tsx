import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Sparkles, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChartDataPoint } from '../../types/dashboard';
import { getMetricNumber } from '../../lib/format.utils';

interface CohortRetentionGridProps {
  data: ChartDataPoint[];
}

/** Build per-cohort retention from raw monthly time-series */
interface CohortRow {
  period: string;
  size: number;
  /** retention[0] is always 100 (month-0), subsequent entries are cumulative % */
  retention: (number | null)[];
}

function buildCohortRows(data: ChartDataPoint[]): CohortRow[] {
  if (!data || data.length === 0) return [];

  // We take up to the last 6 months of data
  const slice = data.slice(Math.max(0, data.length - 6));

  return slice.map((point, idx) => {
    const acquired = getMetricNumber(point as Record<string, unknown>, 'New_Customers_Acquired');
    const churned = getMetricNumber(point as Record<string, unknown>, 'Customers_Churned');

    // Month-0 is always 100 %.
    // For subsequent months we can only compute values for data points that
    // appeared AFTER this cohort's entry month — so months after idx are null.
    const monthsAvailable = slice.length - idx; // 1..6

    // Use a plain for-loop so we can safely read retention[m-1] from the
    // already-populated array (Array.from with a self-referencing closure
    // causes a Temporal Dead Zone ReferenceError).
    const retention: (number | null)[] = [];
    for (let m = 0; m < 6; m++) {
      if (m === 0) { retention.push(100); continue; }
      if (m >= monthsAvailable) { retention.push(null); continue; }

      const futurePeriod = slice[idx + m];
      if (!futurePeriod || acquired <= 0) { retention.push(null); continue; }

      const periodChurned = getMetricNumber(futurePeriod as Record<string, unknown>, 'Customers_Churned');
      const periodAcquired = getMetricNumber(futurePeriod as Record<string, unknown>, 'New_Customers_Acquired') || 1;
      const monthlyChurnRate = periodChurned / periodAcquired;

      // Compound from previous month (already in the array at this point)
      const prevRetention = retention[m - 1];
      if (prevRetention === null) { retention.push(null); continue; }

      const newRetention = Math.max(0, prevRetention * (1 - monthlyChurnRate));
      retention.push(Math.round(newRetention));
    }

    return {
      period: String(point.period || ''),
      size: Math.round(acquired),
      retention,
    };
  });
}

export const CohortRetentionGrid = ({ data }: CohortRetentionGridProps) => {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const cohortRows = useMemo(() => buildCohortRows(data), [data]);

  const hasRealData = cohortRows.length > 0 && cohortRows.some(r => r.size > 0);

  // Return background color based on retention rate
  const getCellColor = (val: number | null) => {
    if (val === null) return 'bg-elevated/20 border-border/10';
    if (val === 100) return 'bg-[#00D1FF]/30 border-[#00D1FF]/40 text-[#00D1FF] font-bold';
    if (val >= 90) return 'bg-emerald-500/25 border-emerald-500/35 text-emerald-400 font-semibold';
    if (val >= 85) return 'bg-teal-500/20 border-teal-500/30 text-teal-400';
    if (val >= 80) return 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400';
    if (val >= 70) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    return 'bg-slate-500/5 border-slate-500/10 text-text-muted';
  };

  return (
    <div className="chart-container relative overflow-hidden stagger-children">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-main heading-serif tracking-tight">
              {t('dashboard.cohorts.title', 'Rétention par Cohortes')}
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-brand/10 text-brand border border-brand/20 rounded-md">
              <Sparkles className="w-2.5 h-2.5" />
              {t('dashboard.cohorts.badge', 'AI Core')}
            </span>
            {/* Live data badge */}
            <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
              <Database className="w-2.5 h-2.5" />
              {t('dashboard.cohorts.liveData', 'Live')}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {t('dashboard.cohorts.subtitle', "Suivi de l'engagement et de l'attrition des utilisateurs par date d'inscription")}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-[#00D1FF]/30 border border-[#00D1FF]/40" />
            <span>100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/35" />
            <span>&gt; 90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-teal-500/20 border border-teal-500/30" />
            <span>85% - 90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-indigo-500/15 border border-indigo-500/25" />
            <span>80% - 85%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-500/5 border border-slate-500/10" />
            <span>&lt; 80%</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasRealData ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3 border border-dashed border-border/40 rounded-2xl bg-elevated/10">
          <Database className="w-7 h-7 text-text-muted/40" />
          <p className="text-sm font-semibold text-text-muted">
            {t('dashboard.cohorts.noData', 'Importez des données incluant New_Customers_Acquired et Customers_Churned pour afficher la rétention par cohortes.')}
          </p>
        </div>
      ) : (
        <>
          {/* Cohorts Heatmap Grid Table */}
          <div className="overflow-x-auto scrollbar-hide relative z-10 rounded-xl border border-border/40">
            <table className="w-full text-center table-fixed min-w-[700px]">
              <thead>
                <tr className="bg-elevated/50">
                  <th className="w-32 px-4 py-3 text-start text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border/40">
                    {t('dashboard.cohorts.cohort', 'Cohorte')}
                  </th>
                  <th className="w-24 px-4 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border/40">
                    {t('dashboard.cohorts.size', 'Taille')}
                  </th>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border/40">
                      {t('dashboard.cohorts.monthIndex', 'M{{index}}', { index: i })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cohortRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-elevated/20 transition-colors">
                    <td className="px-4 py-3.5 text-start text-xs font-semibold text-text-main">
                      {row.period}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary font-medium">
                      {row.size > 0
                        ? t('dashboard.cohorts.clients', '{{count}} clients', { count: row.size })
                        : '—'}
                    </td>
                    {row.retention.map((val, cIdx) => {
                      const isHovered = hoveredCell && hoveredCell.row === rIdx && hoveredCell.col === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className="p-1 cursor-pointer"
                          onMouseEnter={() => val !== null && setHoveredCell({ row: rIdx, col: cIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <motion.div
                            className={`py-3 rounded-lg border text-xs font-medium tabular-nums transition-all duration-200 ${getCellColor(val)}`}
                            animate={{
                              scale: isHovered ? 1.05 : 1,
                              boxShadow: isHovered ? '0 4px 12px rgba(0,209,255,0.15)' : 'none',
                            }}
                          >
                            {val !== null ? `${val}%` : '—'}
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 mt-4 text-[10px] text-text-muted">
            <HelpCircle className="w-3.5 h-3.5 text-[#00D1FF]" />
            <span>
              {t('dashboard.cohorts.help', "Explication : M0 correspond au mois d'inscription (100% actifs). Chaque mois M1–M5 montre le pourcentage de cette cohorte qui est resté engagé, calculé depuis vos données importées.")}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
