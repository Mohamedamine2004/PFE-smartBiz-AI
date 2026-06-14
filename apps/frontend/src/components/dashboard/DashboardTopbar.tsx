import { useTranslation } from 'react-i18next';
import {
  Upload, ClipboardList, Sparkles, Loader2, FileText, Coffee, Sun, Moon
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { DashboardTab } from '../../types/dashboard';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

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
  const { t, i18n } = useTranslation();
  const hour = new Date().getHours();
  const user = useAuthStore(state => state.user);

  // Dynamic SVG animated weather/time icon based on time of day
  const getGreetingIcon = () => {
    if (hour >= 5 && hour < 12) {
      return (
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          <Coffee className="w-[22px] h-[22px] text-amber-500" />
        </motion.div>
      );
    }
    if (hour >= 12 && hour < 18) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          className="flex items-center justify-center"
        >
          <Sun className="w-[22px] h-[22px] text-[#F59E0B] dark:text-[#00D1FF]" />
        </motion.div>
      );
    }
    return (
      <motion.div
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center justify-center"
      >
        <Moon className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {activeBatchId && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2.5 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-sm font-medium">{t('dashboard.banner.historicalSnapshot')}</span>
          </div>
          <button
            onClick={onClearBatchId}
            className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            {t('dashboard.banner.returnLatestData')}
          </button>
        </div>
      )}

      {/* Row 1: Dynamic Greeting & Actions Grid */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4 relative">
        {/* Ambient background glow for greeting */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Dynamic Glassmorphic Greeting Header */}
        <div className="relative z-10 flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-surface/50 dark:bg-white/5 border border-border/40 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] backdrop-blur-md shrink-0">
            {getGreetingIcon()}
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-text-main via-text-main to-text-muted bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t(getGreetingKey(), { name: userName })}
            </h1>
            <p className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
              <span>{t('dashboard.subtitle', 'Voici un aperçu stratégique de votre entreprise.')}</span>
              <span className="text-border/60 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 bg-surface/60 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-border/30">
                <span>{t('topbar.lastSync', 'Dernière synchro')} : {new Date().toLocaleTimeString(i18n.resolvedLanguage === 'ar' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>🇹🇳</span>
              </span>
            </p>
          </div>
        </div>

        {/* Unified Actions Bar (Bento-like alignment) */}
        <div className="flex flex-wrap items-center gap-2.5 xl:justify-end no-print">

          {/* Period Filter (Premium Sliding Capsule Tab) */}
          <div
            className="relative flex items-center gap-0.5 bg-surface border border-border/60 p-1 rounded-2xl sm:mr-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {[
              { id: 'all', label: t('dashboard.filters.all', 'Tout') },
              { id: '12m', label: t('dashboard.filters.month12') },
              { id: '6m', label: t('dashboard.filters.month6') }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onPeriodChange(p.id as 'all' | '12m' | '6m')}
                className={`relative px-3.5 py-1.5 text-xs font-bold transition-all duration-300 rounded-xl cursor-pointer ${period === p.id
                    ? 'text-indigo-600 dark:text-brand'
                    : 'text-text-muted hover:text-text-main'
                  }`}
              >
                {period === p.id && (
                  <motion.div
                    layoutId="activePeriodCapsule"
                    className="absolute inset-0 bg-indigo-50 dark:bg-brand/15 border border-indigo-100 dark:border-brand/20 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.06)] dark:shadow-[0_2px_10px_rgba(0,209,255,0.05)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Export PDF (Interactive Slide Hover) */}
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-border/80 bg-surface/80 hover:bg-elevated hover:border-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,209,255,0.05)] cursor-pointer text-text-main group"
          >
            <motion.div
              whileHover={{ y: 1.5 }}
              transition={{ duration: 0.2 }}
            >
              <FileText className="w-4 h-4 text-text-muted group-hover:text-indigo-600 dark:group-hover:text-brand transition-colors" />
            </motion.div>
            <span className="hidden sm:inline">{t('dashboard.export.pdf')}</span>
          </button>

          {/* Import History (Glowing Count Badge) */}
          <button
            onClick={onToggleHistory}
            className="relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-border/80 bg-surface/80 hover:bg-elevated hover:border-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,209,255,0.05)] cursor-pointer text-text-main group"
          >
            <ClipboardList className="w-4 h-4 text-text-muted group-hover:text-indigo-600 dark:group-hover:text-brand transition-colors" />
            <span className="hidden sm:inline">{t('dashboard.historyBtn', 'History')}</span>
            {importCount > 0 && typeof importCount === 'number' && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-background shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
                {importCount}
              </span>
            )}
          </button>

          {/* Import Button (Prominent Cyan-to-Indigo Call-to-Action) */}
          {user?.role !== 'READER' && (
            <button
              onClick={onNavigateImport}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border border-transparent transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-[0_8px_25px_rgba(99,102,241,0.25)] cursor-pointer text-white"
              style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, #6366F1 100%)',
              }}
            >
              <motion.div
                animate={{ y: [0, -1.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Upload className="w-4 h-4 text-white" />
              </motion.div>
              <span className="hidden sm:inline">{t('dashboard.importBtn')}</span>
            </button>
          )}

          {/* Run AI Prediction — only visible on ML Projection tab */}
          {activeTab === 'ml-projection' && user?.role !== 'READER' && (
            <Button
              onClick={onRunPrediction}
              disabled={predictionLoading}
              icon={predictionLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              className="py-2.5 rounded-xl font-bold text-xs"
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

      {/* Row 2: Tabs (Solid Navigation Capsule) */}
      <div
        className="relative p-1.5 flex gap-1 rounded-2xl bg-surface border border-border/50 self-start w-fit overflow-x-auto scrollbar-hide max-w-full"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 whitespace-nowrap flex-shrink-0 cursor-pointer ${activeTab === key ? 'text-text-main' : 'text-text-muted hover:text-text-main'
              }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="dashboardActiveTab"
                className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};
