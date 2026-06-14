import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Eye, EyeOff, ArrowUpRight, ArrowDownRight, TrendingUp 
} from 'lucide-react';
import type { ChartDataPoint } from '../../types/dashboard';
import { parseMetricValue } from '../../lib/format.utils';

interface CashFlowMetricsTableProps {
  data: ChartDataPoint[];
}

const METRICS = [
  { key: 'Gross_Revenue', labelKey: 'dashboard.charts.metrics.grossRevenue', fallback: 'Gross Revenue' },
  { key: 'Operating_Expenses_Total', labelKey: 'dashboard.charts.metrics.operatingExpensesTotal', fallback: 'Operating Expenses' },
  { key: 'Payroll_Expenses', labelKey: 'dashboard.charts.metrics.payrollExpenses', fallback: 'Payroll' },
  { key: 'Marketing_Spend', labelKey: 'dashboard.charts.metrics.marketingSpend', fallback: 'Marketing' },
  { key: 'Net_Cash_Burn', labelKey: 'dashboard.charts.metrics.netCashBurn', fallback: 'Cash Burn' },
  { key: 'Ending_Cash_Balance', labelKey: 'dashboard.charts.metrics.endingCashBalance', fallback: 'Cash Balance' },
] as const;

export const CashFlowMetricsTable = ({ data }: CashFlowMetricsTableProps) => {
  const { t } = useTranslation();
  const safeData = data || [];

  // --- State for Table Features ---
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(METRICS.map(m => m.key));
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'period',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Calculate MoM Changes map ---
  const momChanges = useMemo(() => {
    // Sort chronological ascending (oldest first) to accurately calculate MoM
    const sortedChronological = [...safeData].sort((a, b) =>
      String(a.period || '').localeCompare(String(b.period || ''))
    );

    const changesMap = new Map<string, Record<string, number | null>>();

    for (let i = 0; i < sortedChronological.length; i++) {
      const current = sortedChronological[i];
      const previous = i > 0 ? sortedChronological[i - 1] : null;
      const periodKey = String(current.period || '');
      
      const metricsChanges: Record<string, number | null> = {};

      METRICS.forEach((m) => {
        const currentVal = Number(current[m.key]) || 0;
        if (!previous) {
          metricsChanges[m.key] = null;
          return;
        }
        const previousVal = Number(previous[m.key]) || 0;

        if (previousVal === 0) {
          metricsChanges[m.key] = currentVal > 0 ? 100 : currentVal < 0 ? -100 : 0;
        } else {
          metricsChanges[m.key] = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
        }
      });

      changesMap.set(periodKey, metricsChanges);
    }

    return changesMap;
  }, [safeData]);

  // --- Helper for trend badge styling ---
  const getTrendStyle = (metricKey: string, change: number | null | undefined) => {
    if (change === null || change === undefined) return null;

    // Determine standard financial logic:
    // - Revenue/Cash Balance: growth is GOOD (+), reduction is BAD (-)
    // - Expenses/Net Cash Burn: growth is BAD (-), reduction is GOOD (+)
    const increaseIsPositive = ['Gross_Revenue', 'Ending_Cash_Balance'].includes(metricKey);
    
    if (Math.abs(change) < 0.01) {
      return {
        colorClass: 'bg-text-muted/10 text-text-muted border-text-muted/20 dark:bg-white/5 dark:text-text-muted dark:border-white/10',
        text: '0.0%',
        isGood: true,
        isUp: false,
        isDown: false
      };
    }

    const isPositiveChange = change > 0;
    const isGood = increaseIsPositive ? isPositiveChange : !isPositiveChange;
    const absChange = Math.abs(change);
    const formattedVal = `${absChange.toFixed(1)}%`;

    if (isGood) {
      return {
        colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/10',
        text: formattedVal,
        isGood: true,
        isUp: isPositiveChange,
        isDown: !isPositiveChange
      };
    } else {
      return {
        colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:bg-rose-500/10 dark:border-rose-500/10',
        text: formattedVal,
        isGood: false,
        isUp: isPositiveChange,
        isDown: !isPositiveChange
      };
    }
  };

  const toggleMetric = (key: string) => {
    setVisibleMetrics(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const selectAll = () => setVisibleMetrics(METRICS.map(m => m.key));
  const clearAll = () => setVisibleMetrics([]);

  // --- Search Filtering ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return safeData;
    const lowerQuery = searchQuery.toLowerCase();

    return safeData.filter(row => {
      // Search in period
      if (String(row.period || '').toLowerCase().includes(lowerQuery)) return true;
      // Search in metric values
      for (const m of METRICS) {
        if (visibleMetrics.includes(m.key)) {
          if (String(row[m.key] || '').toLowerCase().includes(lowerQuery)) return true;
        }
      }
      return false;
    });
  }, [safeData, searchQuery, visibleMetrics]);

  // --- Sorting ---
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'period') {
        const strA = String(a.period || '');
        const strB = String(b.period || '');
        return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }

      const valA = Number(a[sortConfig.key]) || 0;
      const valB = Number(b[sortConfig.key]) || 0;
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  // --- Pagination ---
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="chart-container overflow-visible glass-card p-6 md:p-8 animate-fade-scale">
      {/* ─── Header, Search & Controls ─── */}
      <div className="flex flex-col xl:flex-row justify-between gap-5 mb-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <TrendingUp className="w-5 h-5 text-brand" />
            </div>
            <h3
              className="text-lg font-bold text-text-main tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('dashboard.charts.dataTableProTitle', 'Financial Ledger Database')}
            </h3>
          </div>
          <p className="text-xs font-medium text-text-muted">
            {t('dashboard.charts.dataTableProSubtitle', 'Searchable & sortable raw metrics ledger')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input with Premium Neon Ring */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder={t('dashboard.charts.searchPlaceholder', 'Search metrics...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="pl-9 pr-4 py-2.5 w-full bg-surface/50 border border-border/80 rounded-xl text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 transition-all backdrop-blur-md shadow-inner"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* ─── Column Filter Pills Box ─── */}
      <div className="mb-6 bg-elevated/20 border border-border/30 rounded-2xl p-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {t('dashboard.charts.selectMetrics', 'Indicateurs à afficher')}
          </span>
          <div className="flex gap-3">
            <button
              onClick={selectAll}
              className="text-[11px] font-semibold text-brand hover:text-brand/80 transition-colors cursor-pointer"
            >
              {t('dashboard.charts.selectAll', 'Tout Sélectionner')}
            </button>
            <span className="text-border/40 text-xs">|</span>
            <button
              onClick={clearAll}
              className="text-[11px] font-semibold text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              {t('dashboard.charts.clear', 'Effacer')}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {METRICS.map((metric) => {
            const isVisible = visibleMetrics.includes(metric.key);
            return (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`metric-pill flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                  isVisible 
                    ? 'bg-brand/10 border-brand/20 text-brand font-bold' 
                    : 'bg-surface border-border text-text-muted hover:border-text-muted/40 hover:text-text-main'
                }`}
              >
                {isVisible ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                {t(metric.labelKey, metric.fallback)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Data Table ─── */}
      {sortedData.length === 0 ? (
        <div className="h-40 w-full flex items-center justify-center border border-dashed border-border/50 rounded-2xl bg-surface/30 backdrop-blur-md">
          <p className="text-text-muted text-xs font-semibold">{t('dashboard.charts.noData', 'No data matches your query.')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/50 backdrop-blur-md bg-surface/20 pb-1">
            <table className="table-pro">
              <thead>
                <tr className="bg-elevated/40 border-b border-border/50">
                  <th
                    className="sticky left-0 z-20 cursor-pointer hover:text-brand transition-colors text-xs font-bold py-4 px-4 bg-elevated/60"
                    onClick={() => handleSort('period')}
                    style={{ minWidth: 120 }}
                  >
                    <div className="flex items-center gap-1">
                      {t('dashboard.charts.period', 'Period')}
                      {sortConfig.key === 'period' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" /> : <ChevronDown className="w-3 h-3 text-brand" />
                      )}
                    </div>
                  </th>
                  {METRICS.map((metric) => {
                    if (!visibleMetrics.includes(metric.key)) return null;
                    return (
                      <th
                        key={metric.key}
                        className="cursor-pointer hover:text-brand transition-colors text-xs font-bold py-4 px-4"
                        onClick={() => handleSort(metric.key)}
                        style={{ minWidth: 160 }}
                      >
                        <div className="flex items-center gap-1">
                          {t(metric.labelKey, metric.fallback)}
                          {sortConfig.key === metric.key && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" /> : <ChevronDown className="w-3 h-3 text-brand" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedData.map((row) => {
                  const period = String(row.period);

                  return (
                    <tr key={period} className="relative group hover:bg-brand/[0.02] transition-colors border-b border-border/20">
                      {/* Period column sticky */}
                      <td className="sticky left-0 z-10 font-bold text-xs text-text-main whitespace-nowrap bg-surface/90 group-hover:bg-elevated/40 transition-colors py-3.5 px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-border/10">
                        {period}
                      </td>
                      {METRICS.map((metric) => {
                        if (!visibleMetrics.includes(metric.key)) return null;
                        const value = row[metric.key];
                        const { text, isNegative } = parseMetricValue(value);
                        
                        // MoM change info
                        const change = momChanges.get(period)?.[metric.key];
                        const trend = getTrendStyle(metric.key, change);

                        return (
                          <td
                            key={`${period}-${metric.key}`}
                            className={`whitespace-nowrap py-3 px-4 transition-colors`}
                          >
                            <div className="flex flex-col gap-1 items-start text-left">
                              <span className={`text-xs font-semibold ${isNegative ? 'text-rose-400 font-bold' : 'text-text-secondary group-hover:text-text-main'}`}>
                                {text}
                              </span>
                              {trend && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg border text-[9px] font-bold ${trend.colorClass}`}>
                                  {trend.isUp && <ArrowUpRight className="w-2.5 h-2.5" />}
                                  {trend.isDown && <ArrowDownRight className="w-2.5 h-2.5" />}
                                  {trend.text}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Footer ─── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-xs no-print">
            <div className="flex items-center gap-2 text-text-muted font-bold">
              <span>{t('dashboard.charts.rowsPerPage', 'Rows per page')}:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface border border-border/80 rounded-xl px-2.5 py-1.5 text-text-main focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/10 transition-all cursor-pointer text-xs font-semibold shadow-sm"
              >
                {[5, 10, 25, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline-block ml-4 font-semibold text-text-muted">
                {t('dashboard.charts.showing', 'Showing')} {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, sortedData.length)} {t('dashboard.charts.of', 'of')} {sortedData.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text-main hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Indicators */}
              <div className="flex gap-1.5 px-2 font-bold">
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)).map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 self-center text-text-muted">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer border ${
                        currentPage === p 
                          ? 'bg-indigo-50 border-indigo-100 dark:bg-brand/15 dark:border-brand/20 text-indigo-600 dark:text-brand font-extrabold shadow-sm' 
                          : 'bg-surface border-border text-text-muted hover:border-text-muted/40 hover:text-text-main'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text-main hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
