import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ReportWizard, ReportLibrary } from '../features/report';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';

export const Reports = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [reportCount, setReportCount] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'wizard' | 'library'>(
    tabParam === 'library' ? 'library' : 'wizard'
  );

  useEffect(() => {
    setActiveTab(tabParam === 'library' ? 'library' : 'wizard');
  }, [tabParam]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/report/jobs');
        setReportCount(res.data?.length || 0);
      } catch {
        // ignore
      }
    };
    void fetchCount();
  }, []);

  const handleTabChange = (tab: 'wizard' | 'library') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-8 pb-16">
      {/* Premium Header */}
      <div className="relative mb-10 mt-4">
        {/* Background ambient glow - dynamic based on active tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className={`absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-500 -z-10 ${
              activeTab === 'wizard' 
                ? 'bg-brand/10 dark:bg-brand/15' 
                : 'bg-secondary/10 dark:bg-secondary/15'
            }`}
          />
        </AnimatePresence>

        <div className="flex items-center gap-3 mb-2">
          <div className="px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            AI-POWERED
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2 font-display bg-clip-text bg-gradient-to-r from-text-main to-text-main/80">
          {t('reports.title')}
        </h1>
        <p className="text-text-muted text-sm max-w-2xl">
          {t('reports.subtitle')}
        </p>
      </div>

      {/* Premium Animated Tabs */}
      <div className="relative p-1.5 flex gap-1 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-md self-start w-fit mb-8">
        <button
          onClick={() => handleTabChange('wizard')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
            activeTab === 'wizard' ? 'text-text-main' : 'text-text-muted hover:text-text-main'
          }`}
        >
          {activeTab === 'wizard' && (
            <motion.div
              layoutId="reportsActiveTab"
              className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {t('reports.tabs.wizard')}
        </button>
        <button
          onClick={() => handleTabChange('library')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
            activeTab === 'library' ? 'text-text-main' : 'text-text-muted hover:text-text-main'
          }`}
        >
          {activeTab === 'library' && (
            <motion.div
              layoutId="reportsActiveTab"
              className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="flex items-center gap-1.5">
            {t('reports.tabs.library')}
            {reportCount !== null && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-secondary/15 text-secondary border border-secondary/20">
                {reportCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Content wrapper */}
      <div className="relative">
        <div style={{ display: activeTab === 'wizard' ? 'block' : 'none' }}>
          <ReportWizard />
        </div>
        <div style={{ display: activeTab === 'library' ? 'block' : 'none' }}>
          <ReportLibrary />
        </div>
      </div>
    </div>
  );
};
