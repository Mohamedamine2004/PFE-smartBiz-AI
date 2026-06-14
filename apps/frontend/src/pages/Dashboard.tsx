import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { exportToPDF } from '../lib/export.utils';

import { useAuthStore } from '../store/authStore';
import { financialApi } from '../lib/financial.service';
import type { DashboardMetrics, DashboardTab, PredictionResult } from '../types/dashboard';

import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { StrategicKpisGrid } from '../components/dashboard/StrategicKpisGrid';
import { CohortRetentionGrid } from '../components/dashboard/CohortRetentionGrid';
import { AiStrategicInsight } from '../components/dashboard/AiStrategicInsight';
import { CustomerRetentionChart } from '../components/dashboard/CustomerRetentionChart';
import { CashFlowMetricsTable } from '../components/dashboard/CashFlowMetricsTable';
import { RevenueExpensesChart } from '../components/dashboard/RevenueExpensesChart';
import { ProfitMarginChart } from '../components/dashboard/ProfitMarginChart';
import { RevenuePieChart } from '../components/dashboard/RevenuePieChart';
import { CashRunwayChart } from '../components/dashboard/CashRunwayChart';
import { TrendAnalysisChart } from '../components/dashboard/TrendAnalysisChart';
import { PredictionStatesCard } from '../components/dashboard/PredictionStatesCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ImportHistorySidebar } from '../components/dashboard/ImportHistorySidebar';
import { UnitEconomicsChart } from '../components/dashboard/UnitEconomicsChart';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const VALID_TABS: DashboardTab[] = ['strategic', 'financial', 'operational', 'ml-projection'];

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);

  // State for data
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ML Prediction state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [importCount, setImportCount] = useState(0);

  // Params
  const batchIdParam = searchParams.get('batchId');

  // Tab navigation from URL query param
  const tabParam = searchParams.get('tab');
  const activeTab: DashboardTab =
    VALID_TABS.includes(tabParam as DashboardTab)
      ? (tabParam as DashboardTab)
      : 'strategic';

  // Filters State
  const [period, setPeriod] = useState<'all' | '12m' | '6m'>('12m');

  // Fetch count
  const fetchImportCount = useCallback(async () => {
    try {
      const history = await financialApi.getImportHistory();
      setImportCount(history.length);
    } catch {
      // fail silently
    }
  }, []);

  // Fetch metrics from backend
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = batchIdParam
        ? await financialApi.getDashboardMetricsByBatchId(batchIdParam)
        : await financialApi.getDashboardMetrics();
      setMetrics(data);
    } catch {
      setError(t('dashboard.fetchError', 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, [t, batchIdParam]);

  // Fetch latest or historical prediction
  const fetchPrediction = useCallback(async () => {
    try {
      const data = await financialApi.getPrediction(batchIdParam || undefined);
      setPrediction(data);
    } catch {
      // Silently fail — prediction is optional
    }
  }, [batchIdParam]);

  useEffect(() => {
    fetchDashboard();
    fetchPrediction();
    fetchImportCount();
  }, [fetchDashboard, fetchPrediction, fetchImportCount]);

  // Normalize invalid/missing tab in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!VALID_TABS.includes(tab as DashboardTab)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'strategic');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (tab: DashboardTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  // Run ML prediction
  const handleRunPrediction = async () => {
    try {
      setPredictionLoading(true);
      await financialApi.runPrediction(batchIdParam || undefined);
      toast.success(t('dashboard.mlZone.predictionStarted', 'ML prediction started. This may take a moment...'));

      // Poll for completion (up to 30s)
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = 2000;

      const poll = async () => {
        attempts++;
        const result = await financialApi.getPrediction(batchIdParam || undefined);
        setPrediction(result);

        if (result.status === 'COMPLETED') {
          setPredictionLoading(false);
          toast.success(t('dashboard.mlZone.predictionComplete', 'Prediction complete!'));
          return;
        }

        if (result.status === 'FAILED' || attempts >= maxAttempts) {
          setPredictionLoading(false);
          toast.error(t('dashboard.mlZone.predictionFailed', 'Prediction failed. Please try again.'));
          return;
        }

        setTimeout(poll, pollInterval);
      };

      // Start polling after a brief delay
      setTimeout(poll, 1500);
    } catch {
      setPredictionLoading(false);
      toast.error(t('dashboard.mlZone.error', 'Failed to start prediction.'));
      setPrediction((prev) =>
        prev
          ? { ...prev, status: 'FAILED', error: t('dashboard.mlZone.error') }
          : { hasPrediction: false, status: 'FAILED', error: t('dashboard.mlZone.error') }
      );
    }
  };

  const handleClearBatchId = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('batchId');
    setSearchParams(next);
  };

  const handleSelectBatch = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('batchId', id);
    setSearchParams(next);
  };

  const handleBatchDeleted = (deletedId: string) => {
    fetchImportCount();
    if (batchIdParam === deletedId) {
      handleClearBatchId();
    } else {
      fetchDashboard();
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const formattedDate = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    document.title = `SmartBiz-AI-Dashboard-${formattedDate}`;
    window.print();
    document.title = originalTitle;
  };

  // Derive filtered metrics based on period
  const getFilteredChartData = () => {
    if (!metrics?.chartData) return [];

    // Sort array by date (assuming they are strictly sequential ascending by 'month' strings like '2023-01' or similar format)
    // If it's already sorted from API, that's fine. We slice from end.
    const len = metrics.chartData.length;

    if (period === 'all') return metrics.chartData;
    if (period === '12m') return metrics.chartData.slice(Math.max(0, len - 12));
    if (period === '6m') return metrics.chartData.slice(Math.max(0, len - 6));

    return metrics.chartData;
  };

  const filteredChartData = getFilteredChartData();

  if (loading) {
    return (
      <div className="space-y-5 page-animate">
        {/* Topbar Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 rounded-lg bg-elevated/60 animate-pulse" />
            <div className="flex gap-2">
              {['strategic', 'financial', 'operational'].map((tab) => (
                <div key={tab} className="h-9 w-24 rounded-lg bg-elevated/40 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-elevated/40 animate-pulse" />
            <div className="h-9 w-28 rounded-lg bg-elevated/40 animate-pulse" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="h-4 w-20 rounded bg-elevated/40 animate-pulse mb-3" />
              <div className="h-8 w-24 rounded bg-elevated/60 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-6 h-80">
            <div className="h-5 w-40 rounded bg-elevated/40 animate-pulse mb-4" />
            <div className="h-56 w-full rounded bg-elevated/30 animate-pulse" />
          </div>
          <div className="glass-card p-6 h-80">
            <div className="h-5 w-40 rounded bg-elevated/40 animate-pulse mb-4" />
            <div className="h-56 w-full rounded bg-elevated/30 animate-pulse" />
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-64">
              <div className="h-5 w-32 rounded bg-elevated/40 animate-pulse mb-4" />
              <div className="h-40 w-full rounded bg-elevated/30 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-center font-medium">
          {error}
        </div>
      </div>
    );
  }

  // Show empty state when no financial data exists
  if (!metrics || !metrics.chartData || metrics.chartData.length === 0) {
    return (
      <div className="space-y-5 page-animate">
        <DashboardTopbar
          userName={user?.firstName || ''}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          importCount={importCount}
          onToggleHistory={() => setIsHistoryOpen(true)}
          onNavigateImport={() => navigate('/import')}
          onRunPrediction={handleRunPrediction}
          predictionLoading={predictionLoading}
          onExportPDF={handleExportPDF}
          period={period}
          onPeriodChange={setPeriod}
          activeBatchId={batchIdParam}
          onClearBatchId={handleClearBatchId}
        />
        <EmptyState
          icon={TrendingUp}
          title={t('dashboard.empty.title', 'No financial data yet')}
          description={t('dashboard.empty.description', 'Import your financial data to unlock AI-powered insights, valuations, and strategic forecasts.')}
          actionLabel={t('dashboard.empty.action', 'Import Data')}
          onAction={() => navigate('/import')}
        />
      </div>
    );
  }

  /* Full dashboard — Tab-based Layout */
  return (
    <div id="dashboard-root-export" className="space-y-5 page-animate">
      <DashboardTopbar
        userName={user?.firstName || ''}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        importCount={importCount}
        onToggleHistory={() => setIsHistoryOpen(true)}
        onNavigateImport={() => navigate('/import')}
        onRunPrediction={handleRunPrediction}
        predictionLoading={predictionLoading}
        onExportPDF={handleExportPDF}
        period={period}
        onPeriodChange={setPeriod}
        activeBatchId={batchIdParam}
        onClearBatchId={handleClearBatchId}
      />

      {/* Zone 1: Strategic KPIs */}
      <StrategicKpisGrid data={metrics?.strategicKpis} activeTab={activeTab} chartData={filteredChartData} />

      {/* Tab Content */}
      <div className="page-animate">
        {/* ─── Strategic Tab ─── */}
        {activeTab === 'strategic' && (
          <div className="space-y-5">
            <AiStrategicInsight data={filteredChartData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RevenueExpensesChart data={filteredChartData} />
              <ProfitMarginChart data={filteredChartData} />
            </div>
          </div>
        )}

        {/* ─── Financial Tab ─── */}
        {activeTab === 'financial' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TrendAnalysisChart data={filteredChartData} />
              <RevenueExpensesChart data={filteredChartData} />
            </div>
            <div className="grid grid-cols-1 gap-5">
              <CashRunwayChart data={filteredChartData} />
            </div>
            <CashFlowMetricsTable data={filteredChartData} />
          </div>
        )}

        {/* ─── Operational Tab ─── */}
        {activeTab === 'operational' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CustomerRetentionChart data={filteredChartData} />
              <RevenuePieChart data={filteredChartData} />
            </div>
            <CohortRetentionGrid data={filteredChartData} />
            <UnitEconomicsChart kpis={metrics?.strategicKpis} />
          </div>
        )}

        {/* ─── ML Projection Tab ─── */}
        {activeTab === 'ml-projection' && (
          <PredictionStatesCard
            prediction={prediction}
            historicalMetrics={metrics}
            loading={predictionLoading}
            onRunPrediction={handleRunPrediction}
            onNavigateImport={() => navigate('/import')}
          />
        )}
      </div>

      <ImportHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activeBatchId={batchIdParam}
        onSelectBatch={handleSelectBatch}
        onBatchDeleted={handleBatchDeleted}
      />
    </div>
  );
};