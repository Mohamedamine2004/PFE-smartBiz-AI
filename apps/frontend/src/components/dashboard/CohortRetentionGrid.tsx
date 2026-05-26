import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock high-fidelity cohort retention data
const COHORT_DATA = [
  { monthKey: 'dashboard.cohorts.months.jan', monthDefault: 'Janvier 2026', size: 120, retention: [100, 94, 88, 83, 79, 74] },
  { monthKey: 'dashboard.cohorts.months.feb', monthDefault: 'Février 2026', size: 145, retention: [100, 96, 91, 86, 81, null] },
  { monthKey: 'dashboard.cohorts.months.mar', monthDefault: 'Mars 2026', size: 168, retention: [100, 93, 89, 84, null, null] },
  { monthKey: 'dashboard.cohorts.months.apr', monthDefault: 'Avril 2026', size: 195, retention: [100, 97, 92, null, null, null] },
  { monthKey: 'dashboard.cohorts.months.may', monthDefault: 'Mai 2026', size: 220, retention: [100, 95, null, null, null, null] },
  { monthKey: 'dashboard.cohorts.months.jun', monthDefault: 'Juin 2026', size: 250, retention: [100, null, null, null, null, null] },
];

export const CohortRetentionGrid = () => {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

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
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {t('dashboard.cohorts.subtitle', 'Suivi de l\'engagement et de l\'attrition des utilisateurs par date d\'inscription')}
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
            {COHORT_DATA.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-elevated/20 transition-colors">
                <td className="px-4 py-3.5 text-start text-xs font-semibold text-text-main">
                  {t(row.monthKey, row.monthDefault)}
                </td>
                <td className="px-4 py-3.5 text-xs text-text-secondary font-medium">
                  {t('dashboard.cohorts.clients', '{{count}} clients', { count: row.size })}
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
                        {val !== null ? `${val}%` : '-'}
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
          {t('dashboard.cohorts.help', 'Explication : M0 correspond au mois d\'inscription (100% actifs). Chaque mois M1-M5 montre le pourcentage de cette cohorte qui est resté engagé.')}
        </span>
      </div>
    </div>
  );
};
