import { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, FileSearch } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import logoLight from '../../assets/logol.svg';
import logoDark from '../../assets/logod.svg';

export const InteractiveMockup = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'valuation' | 'forecast' | 'risk'>('valuation');

  return (
    <section className="relative -mt-10 mb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative rounded-2xl md:rounded-[2rem] border border-border/50 bg-surface/40 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.4)] p-2 md:p-4 overflow-hidden"
      >
        {/* Glow effect around the dashboard */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand/5 to-transparent pointer-events-none" />

        {/* Mac OS Window Controls & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-b border-border/50 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error/80" />
            <div className="w-3 h-3 rounded-full bg-warning/80" />
            <div className="w-3 h-3 rounded-full bg-success/80" />
          </div>

          <div className="flex bg-elevated/50 p-1 rounded-xl border border-border/50 backdrop-blur-md">
            {(['valuation', 'forecast', 'risk'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${activeTab === tabKey ? 'text-text-main' : 'text-text-muted hover:text-text-main'
                  }`}
              >
                {activeTab === tabKey && (
                  <motion.div
                    layoutId="activeMockupTab"
                    className="absolute inset-0 bg-surface border border-border/50 rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="capitalize">{t(`landing.mockup.tabs.${tabKey}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup Body */}
        <div className="p-4 md:p-8 bg-background/80 rounded-b-xl border border-border/30 relative overflow-hidden min-h-[450px]">

          {/* Giant Logo Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.02] pointer-events-none z-0 overflow-hidden">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt=""
              className="w-[120%] h-auto min-w-[800px] object-cover scale-150 rotate-[-15deg] blur-[2px]"
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-surface/80 backdrop-blur-md rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('landing.mockup.kpis.enterpriseValue')}</p>
                <p className="text-2xl font-bold text-text-main tabular-nums">€12.4M</p>
              </div>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('landing.mockup.kpis.projectedGrowth')}</p>
                <p className="text-2xl font-bold text-success tabular-nums">+15.2%</p>
              </div>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('landing.mockup.kpis.mlReliability')}</p>
                <p className="text-2xl font-bold text-text-main tabular-nums">94.8%</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-surface/80 rounded-xl p-6 border border-border shadow-sm min-h-[300px] flex flex-col justify-end overflow-hidden backdrop-blur-sm group hover:border-brand/30 transition-all duration-500">
            <AnimatePresence mode="wait">
              {activeTab === 'valuation' && (
                <motion.div
                  key="valuation"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col justify-end w-full h-full pb-4"
                >
                  <div className="flex items-end justify-between h-48 gap-2 mt-auto px-4 z-10 w-full opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    {[40, 55, 45, 70, 65, 80, 95, 85].map((h, i) => (
                      <div
                        key={i}
                        className="w-1/8 w-full bg-gradient-to-t from-brand/90 to-secondary/60 rounded-t-lg relative group-hover:from-brand group-hover:to-secondary transition-all duration-500"
                        style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-text-main tabular-nums">
                          {h}k
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'forecast' && (
                <motion.div
                  key="forecast"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-center w-full max-w-md">
                    <FileSearch className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                    <h4 className="text-xl font-bold text-text-main mb-2">{t('landing.mockup.forecast.title')}</h4>
                    <p className="text-text-muted text-sm">{t('landing.mockup.forecast.desc')}</p>
                  </div>
                </motion.div>
              )}
              {activeTab === 'risk' && (
                <motion.div
                  key="risk"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex items-center justify-center p-6"
                >
                  <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="bg-elevated p-4 rounded-xl border border-border/50">
                      <ShieldAlert className="w-6 h-6 text-warning mb-2" />
                      <div className="font-bold text-text-main">{t('landing.mockup.risk.sectorRisk')}</div>
                      <div className="text-2xl font-black text-warning">{t('landing.mockup.risk.medium')}</div>
                    </div>
                    <div className="bg-elevated p-4 rounded-xl border border-border/50">
                      <TrendingUp className="w-6 h-6 text-success mb-2" />
                      <div className="font-bold text-text-main">{t('landing.mockup.risk.survivalRate')}</div>
                      <div className="text-2xl font-black text-success">86%</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 top-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2NjdGRjZCIvPjwvc3ZnPg==')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
