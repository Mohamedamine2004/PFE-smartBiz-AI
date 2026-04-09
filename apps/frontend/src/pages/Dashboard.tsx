import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../store/authStore';
import { financialApi } from '../lib/financial.service';
import { exportToPDF } from '../lib/export.utils';
import type { DashboardMetrics, DashboardTab, PredictionResult } from '../types/dashboard';

import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { StrategicKpisGrid } from '../components/dashboard/StrategicKpisGrid';
import { AiStrategicInsight } from '../components/dashboard/AiStrategicInsight';
import { CustomerRetentionChart } from '../components/dashboard/CustomerRetentionChart';
import { CashFlowMetricsTable } from '../components/dashboard/CashFlowMetricsTable';
import { RevenueExpensesChart } from '../components/dashboard/RevenueExpensesChart';
import { ProfitMarginChart } from '../components/dashboard/ProfitMarginChart';
import { RevenuePieChart } from '../components/dashboard/RevenuePieChart';
import { CashRunwayChart } from '../components/dashboard/CashRunwayChart';
import { TrendAnalysisChart } from '../components/dashboard/TrendAnalysisChart';
import { PredictionStatesCard } from '../components/dashboard/PredictionStatesCard';

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

  // Tab navigation from URL query param
  const tabParam = searchParams.get('tab');
  const activeTab: DashboardTab =
    VALID_TABS.includes(tabParam as DashboardTab)
      ? (tabParam as DashboardTab)
      : 'strategic';

  // Filters State
  const [period, setPeriod] = useState<'all' | '12m' | '6m'>('12m');

  // Fetch metrics from backend
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financialApi.getDashboardMetrics();
      setMetrics(data);
    } catch {
      setError(t('dashboard.fetchError', 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch latest prediction
  const fetchPrediction = useCallback(async () => {
    try {
      const data = await financialApi.getPrediction();
      setPrediction(data);
    } catch {
      // Silently fail — prediction is optional
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchPrediction();
  }, [fetchDashboard, fetchPrediction]);

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
      await financialApi.runPrediction();

      // Poll for completion (up to 30s)
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = 2000;

      const poll = async () => {
        attempts++;
        const result = await financialApi.getPrediction();
        setPrediction(result);

        if (
          result.status === 'COMPLETED' ||
          result.status === 'FAILED' ||
          attempts >= maxAttempts
        ) {
          setPredictionLoading(false);
          return;
        }

        setTimeout(poll, pollInterval);
      };

      // Start polling after a brief delay
      setTimeout(poll, 1500);
    } catch {
      setPredictionLoading(false);
      setPrediction((prev) =>
        prev
          ? { ...prev, status: 'FAILED', error: t('dashboard.mlZone.error') }
          : { hasPrediction: false, status: 'FAILED', error: t('dashboard.mlZone.error') }
      );
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const handleExportPDF = async () => {
    // Generate snapshot from the root dashboard ID container
    await exportToPDF('dashboard-root-export');
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
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
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

  /* Full dashboard — Tab-based Layout */
  return (
    <div id="dashboard-root-export" className="space-y-5 page-animate">
      {/* Topbar: Tabs + Actions */}
      <DashboardTopbar
        userName={user?.firstName || ''}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        importCount={0}
        onToggleHistory={() => {}}
        onNavigateImport={() => navigate('/import')}
        onRunPrediction={handleRunPrediction}
        predictionLoading={predictionLoading}
        onExportPDF={handleExportPDF}
        period={period}
        onPeriodChange={setPeriod}
      />
      
      {/* Zone 1: Strategic KPIs */}
      <StrategicKpisGrid data={metrics?.strategicKpis} />

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
            <div className="grid grid-cols-1 gap-5">
              <CashRunwayChart data={filteredChartData} />
            </div>
          </div>
        )}

        {/* ─── ML Projection Tab ─── */}
        {activeTab === 'ml-projection' && (
          <PredictionStatesCard
            prediction={prediction}
            loading={predictionLoading}
            onRunPrediction={handleRunPrediction}
            onNavigateImport={() => navigate('/import')}
          />
        )}
      </div>
    </div>
  );
};