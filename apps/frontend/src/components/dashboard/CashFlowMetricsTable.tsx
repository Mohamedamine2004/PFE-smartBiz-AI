import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChartDataPoint } from '../../types/dashboard';

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



const formatMetricValue = (value: string | number | undefined): { text: string; isNegative: boolean } => {
  if (typeof value === 'number') {
    return {
      text: value.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      isNegative: value < 0,
    };
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return {
        text: parsed.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        isNegative: parsed < 0,
      };
    }
  }
  return { text: 'N/A', isNegative: false };
};

export const CashFlowMetricsTable = ({ data }: CashFlowMetricsTableProps) => {
  const { t } = useTranslation();
  const safeData = data || [];

  // --- State for Table Features ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'period',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Search Filtering ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return safeData;
    const lowerQuery = searchQuery.toLowerCase();
    
    return safeData.filter(row => {
      // Search in period
      if (String(row.period || '').toLowerCase().includes(lowerQuery)) return true;
      // Search in metric values
      for (const m of METRICS) {
        if (String(row[m.key] || '').toLowerCase().includes(lowerQuery)) return true;
      }
      return false;
    });
  }, [safeData, searchQuery]);

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
    <div className="chart-container overflow-visible">
      {/* ─── Header, Search & Controls ─── */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h3
            className="text-lg font-bold text-text-main tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('dashboard.charts.dataTableProTitle', 'Financial Ledger Database')}
          </h3>
          <p className="text-xs font-medium text-text-muted">
            {t('dashboard.charts.dataTableProSubtitle', 'Searchable & sortable raw metrics ledger')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('dashboard.charts.searchPlaceholder', 'Search metrics...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="pl-9 pr-4 py-2 w-full md:w-64 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* ─── Data Table ─── */}
      {sortedData.length === 0 ? (
        <div className="h-40 w-full flex items-center justify-center border border-dashed border-border rounded-xl bg-surface">
          <p className="text-text-muted text-sm">{t('dashboard.charts.noData', 'No data matches your query.')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border pb-1">
            <table className="table-pro">
              <thead>
                <tr>
                  <th 
                    className="sticky left-0 z-20 cursor-pointer hover:text-brand transition-colors" 
                    onClick={() => handleSort('period')}
                    style={{ minWidth: 120 }}
                  >
                    <div className="flex items-center gap-1">
                      {t('dashboard.charts.period', 'Period')}
                      {sortConfig.key === 'period' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  {METRICS.map((metric) => (
                    <th 
                      key={metric.key} 
                      className="cursor-pointer hover:text-brand transition-colors"
                      onClick={() => handleSort(metric.key)}
                      style={{ minWidth: 140 }}
                    >
                      <div className="flex items-center gap-1">
                        {t(metric.labelKey, metric.fallback)}
                        {sortConfig.key === 'period' ? null : sortConfig.key === metric.key && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedData.map((row) => {
                  const period = String(row.period);

                  return (
                    <tr key={period} className="relative group hover:bg-elevated/50 transition-colors">
                      <td className="sticky left-0 z-10 font-semibold text-text-main whitespace-nowrap bg-surface group-hover:bg-elevated/50 transition-colors py-3 px-4">
                        {period}
                      </td>
                      {METRICS.map((metric) => {
                        const { text, isNegative } = formatMetricValue(row[metric.key]);
                        return (
                          <td
                            key={`${period}-${metric.key}`}
                            className={`whitespace-nowrap py-3 px-4 ${isNegative ? 'text-rose-400 font-medium bg-rose-500/5' : 'text-text-secondary group-hover:text-text-main'}`}
                          >
                            {text}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2 text-text-muted font-medium">
              <span>{t('dashboard.charts.rowsPerPage', 'Rows per page')}:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-elevated border border-border rounded-md px-2 py-1 text-text-main focus:outline-none focus:border-brand"
              >
                {[5, 10, 25, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline-block ml-4">
                {t('dashboard.charts.showing', 'Showing')} {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, sortedData.length)} {t('dashboard.charts.of', 'of')} {sortedData.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border text-text-main hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Indicators */}
              <div className="flex gap-1 px-2 font-medium text-text-muted">
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)).map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && p - arr[i-1] > 1 && <span className="px-1">...</span>}
                    <button 
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${currentPage === p ? 'bg-brand text-black font-bold' : 'hover:bg-elevated hover:text-text-main'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-border text-text-main hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
