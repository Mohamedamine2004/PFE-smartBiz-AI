import { useTranslation } from 'react-i18next';
import {
  Upload, ClipboardList, Sparkles, Loader2, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { DashboardTab } from '../../types/dashboard';

interface DashboardTopbarProps {
  userName: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  importCount: number;
  onToggleHistory: () => void;
  onNavigateImport: () => void;
  onRunPrediction: () => void;
  predictionLoading: boolean;
  onExportPDF: () => void;
  period: 'all' | '12m' | '6m';
  onPeriodChange: (period: 'all' | '12m' | '6m') => void;
  activeBatchId?: string | null;
  onClearBatchId?: () => void;
}

const getGreetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
};

const TABS: { key: DashboardTab; labelKey: string }[] = [
  { key: 'strategic', labelKey: 'dashboard.tabs.strategic' },
  { key: 'financial', labelKey: 'dashboard.tabs.financial' },
  { key: 'operational', labelKey: 'dashboard.tabs.operational' },
  { key: 'ml-projection', labelKey: 'dashboard.tabs.mlProjection' },
];

export const DashboardTopbar = ({
  userName,
  activeTab,
  onTabChange,
  importCount,
  onToggleHistory,
  onNavigateImport,
  onRunPrediction,
  predictionLoading,
  onExportPDF,
  period,
  onPeriodChange,
  activeBatchId,
  onClearBatchId,
}: DashboardTopbarProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {activeBatchId && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2.5 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-sm font-medium">{t('dashboard.banner.historicalSnapshot')}</span>
          </div>
          <button
            onClick={onClearBatchId}
            className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 px-3 py-1.5 rounded-md transition-colors"
          >
            {t('dashboard.banner.returnLatestData')}
          </button>
        </div>
      )}

      {/* Row 1: Greeting + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            {t(getGreetingKey(), { name: userName })}
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
          {/* Period Filter */}
          <div className="flex flex-wrap items-center gap-1 bg-surface border border-border p-1 rounded-md sm:mr-4 shadow-sm">
            {[
              { id: 'all', label: t('dashboard.filters.all', 'Tout') },
              { id: '12m', label: t('dashboard.filters.month12') },
              { id: '6m', label: t('dashboard.filters.month6') }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onPeriodChange(p.id as 'all' | '12m' | '6m')}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  period === p.id 
                    ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm' 
                    : 'text-text-muted hover:text-text-main hover:bg-elevated'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <Button
            variant="outline"
            onClick={onExportPDF}
            icon={<FileText className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">{t('dashboard.export.pdf')}</span>
          </Button>

          {/* Import History Button */}
          <button onClick={onToggleHistory} className="action-btn relative">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.historyBtn', 'History')}</span>
            {importCount > 0 && typeof importCount === 'number' && (
              <span className="badge-count animate-in zoom-in duration-300">
                {importCount}
              </span>
            )}
          </button>

          {/* Import Button */}
          <Button
            variant="outline"
            onClick={onNavigateImport}
            icon={<Upload className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">{t('dashboard.importBtn')}</span>
          </Button>

          {/* Run AI Prediction — primary action — Visible on Strategic & ML Projection tabs */}
          {(activeTab === 'strategic' || activeTab === 'ml-projection') && (
            <Button
              onClick={onRunPrediction}
              disabled={predictionLoading}
              icon={predictionLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
            >
              <span className="hidden md:inline">
                {predictionLoading
                  ? t('dashboard.mlZone.running')
                  : t('dashboard.mlZone.runPrediction')}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border">
        {/* Navigation Tabs */}
        <div className="flex">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium
                border-b-2 transition-all duration-200
                ${activeTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text-main hover:border-text-muted/30'}
              `}
            >
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
