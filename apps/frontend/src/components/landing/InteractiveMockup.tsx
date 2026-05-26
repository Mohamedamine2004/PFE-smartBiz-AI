import { useState, useRef } from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, FileSearch, Brain, Activity, Cpu, ArrowUpRight } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import logoLight from '../../assets/logol.svg';
import logoDark from '../../assets/logod.svg';

const LiveIndicator = () => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
    </span>
    <span className="text-[10px] font-semibold text-success tracking-widest uppercase">Live</span>
  </div>
);

const MiniSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const norm = values.map(v => ((v - min) / (max - min || 1)) * 28);
  const w = 60;
  const pts = norm.map((v, i) => `${(i / (norm.length - 1)) * w},${28 - v}`).join(' ');
  return (
    <svg width={w} height="32" viewBox={`0 0 ${w} 32`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx={(w)} cy={28 - norm[norm.length - 1]} r="2" fill={color} />
    </svg>
  );
};

export const InteractiveMockup = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'valuation' | 'forecast' | 'risk'>('valuation');
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPos * 8);
    mouseY.set(yPos * 8);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateX = useMotionTemplate`rotateX(${mouseY}deg)`;
  const rotateY = useMotionTemplate`rotateY(${-mouseX}deg)`;

  const tabs = [
    { key: 'valuation', icon: BarChart3, label: t('landing.mockup.tabs.valuation') },
    { key: 'forecast', icon: FileSearch, label: t('landing.mockup.tabs.forecast') },
    { key: 'risk', icon: ShieldAlert, label: t('landing.mockup.tabs.risk') },
  ] as const;

  const barData = [40, 55, 45, 70, 65, 80, 95, 85, 100, 90];

  return (
    <section className="relative -mt-10 mb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-20">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1400 }}
        className="relative"
      >
        {/* Outer glow */}
        <div className="absolute -inset-8 rounded-[3rem] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,209,255,0.1) 0%, transparent 65%)' }}
        />

        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative rounded-2xl md:rounded-[2rem] border border-border/50 bg-surface/40 backdrop-blur-2xl shadow-[0_48px_140px_rgba(0,0,0,0.55)] overflow-hidden"
        >
          {/* Subtle inner glow gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-secondary/5 pointer-events-none rounded-[2rem]" />

          {/* ═══ TOP BAR — Editorial Browser Chrome ═══ */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3.5 border-b border-border/40 bg-surface/50 backdrop-blur-md gap-3">

            {/* Left: traffic lights + identity */}
            <div className="flex items-center gap-3">
              {/* Traffic lights */}
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
              </div>

              <div className="w-px h-4 bg-border/50" />

              {/* Branded identity area */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-brand/15 border border-brand/20 flex items-center justify-center">
                  <Cpu className="w-3 h-3 text-brand" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-text-main tracking-tight leading-none">SmartBiz</span>
                  <span className="text-[10px] font-medium text-brand tracking-widest uppercase leading-none">AI</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-elevated/60 border border-border/40">
                  <span className="text-[9px] font-mono text-text-muted/60 tracking-wide">v2.4.1</span>
                </div>
              </div>

              <LiveIndicator />
            </div>

            {/* Center: address bar (desktop) */}
            <div className="hidden lg:flex flex-1 max-w-xs mx-auto items-center gap-2 px-3 py-1.5 rounded-lg bg-elevated/60 border border-border/30">
              <Activity className="w-3 h-3 text-brand shrink-0" />
              <span className="text-[10px] font-mono text-text-muted/50 truncate">app.smartbiz.ai / analyse / PME-2024</span>
            </div>

            {/* Right: Tab Navigation */}
            <div className="flex bg-elevated/60 p-1 rounded-xl border border-border/40 shadow-inner self-start md:self-auto">
              {tabs.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                    activeTab === key ? 'text-text-main' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {activeTab === key && (
                    <motion.div
                      layoutId="activeMockupTab"
                      className="absolute inset-0 bg-surface border border-border/50 rounded-lg shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                    />
                  )}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ DASHBOARD BODY ═══ */}
          <div className="relative p-4 md:p-6 bg-background/85 min-h-[500px]">

            {/* Logo watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] dark:opacity-[0.015] pointer-events-none z-0">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="" className="w-[160%] min-w-[700px] object-contain rotate-[-10deg] blur-[2px]" />
            </div>

            {/* KPI row */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
              {[
                {
                  icon: BarChart3, label: t('landing.mockup.kpis.enterpriseValue'), value: '€12.4M',
                  color: 'brand', sub: 'Valuation', spark: [60, 72, 65, 80, 78, 88, 95], change: '+8.2%'
                },
                {
                  icon: TrendingUp, label: t('landing.mockup.kpis.projectedGrowth'), value: '+15.2%',
                  color: 'success', sub: '5-Year CAGR', spark: [50, 58, 55, 70, 68, 80, 82], change: '+3.1%', isPositive: true
                },
                {
                  icon: PieChart, label: t('landing.mockup.kpis.mlReliability'), value: '94.8%',
                  color: 'secondary', sub: 'ML Model', spark: [88, 90, 87, 93, 91, 95, 94], change: '+0.4%'
                }
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: 'easeOut' }}
                  className="glass-card p-4 hover:border-brand/30 transition-all duration-200 group cursor-default"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${kpi.color}/10 border border-${kpi.color}/15`}>
                      <kpi.icon className={`w-4 h-4 text-${kpi.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-[10px] font-bold text-success">{kpi.change}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-text-muted/70 mb-0.5">{kpi.label}</p>
                  <p className={`text-xl font-black tabular-nums tracking-tight ${kpi.isPositive ? 'text-success' : 'text-text-main'} mb-2`}>
                    {kpi.value}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="text-[9px] text-text-muted/50 uppercase tracking-wider">{kpi.sub}</span>
                    <MiniSparkline values={kpi.spark} color={`var(--${kpi.color})`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Chart Area */}
            <div className="relative z-10 bg-surface/70 rounded-xl p-4 md:p-5 border border-border/50 shadow-sm min-h-[300px] flex flex-col justify-end overflow-hidden backdrop-blur-sm group hover:border-brand/25 transition-all duration-200">
              {/* Chart header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/15 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-main leading-tight">
                      {activeTab === 'valuation' && '5-Year Business Valuation'}
                      {activeTab === 'forecast' && '5-Year ML Forecast Model'}
                      {activeTab === 'risk' && '5-Year Risk & Survival Analysis'}
                    </h3>
                    <p className="text-[10px] text-text-muted/60 mt-0.5">
                      {activeTab === 'valuation' && 'Trusted valuation · DCF + Market Comps'}
                      {activeTab === 'forecast' && '12,450 Monte Carlo simulations'}
                      {activeTab === 'risk' && 'Sector volatility · Survival probability'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-text-muted/40 hidden md:inline">2025 – 2034</span>
                  <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'valuation' && (
                  <motion.div
                    key="valuation"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 flex flex-col justify-end w-full pb-2"
                  >
                    <div className="flex items-end justify-between h-40 gap-1.5 px-1">
                      {barData.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group/bar cursor-pointer">
                          <div className="relative w-full">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-100 text-[9px] font-bold text-text-main whitespace-nowrap bg-surface border border-border px-1.5 py-0.5 rounded shadow-lg z-10">
                              €{h}k
                            </div>
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full rounded-t-md relative overflow-hidden"
                            style={{
                              background: i === barData.length - 1
                                ? 'linear-gradient(to top, rgba(0,209,255,0.9), rgba(0,209,255,0.6))'
                                : 'linear-gradient(to top, rgba(0,209,255,0.5), rgba(0,209,255,0.25))',
                              height: `${h}%`
                            }}
                          >
                            {i === barData.length - 1 && (
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                            )}
                          </motion.div>
                          <span className="text-[9px] text-text-muted/40 text-center mt-1.5 block">{2025 + i}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'forecast' && (
                  <motion.div
                    key="forecast"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 flex items-center justify-center py-4"
                  >
                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                      {[
                        { label: 'Scénario Optimiste', value: '+24.7%', color: 'success', bar: 82 },
                        { label: 'Scénario Central', value: '+15.2%', color: 'brand', bar: 62 },
                        { label: 'Scénario Pessimiste', value: '+6.1%', color: 'warning', bar: 38 },
                        { label: 'Confiance ML', value: '94.8%', color: 'secondary', bar: 90 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          className="glass-card p-3.5"
                        >
                          <p className="text-[10px] text-text-muted/70 mb-1.5 font-medium">{item.label}</p>
                          <p className={`text-lg font-black text-${item.color} mb-2`}>{item.value}</p>
                          <div className="h-1 rounded-full bg-border/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.bar}%` }}
                              transition={{ delay: i * 0.05 + 0.1, duration: 0.4, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-${item.color}`}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'risk' && (
                  <motion.div
                    key="risk"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 flex items-center justify-center py-4"
                  >
                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                      {[
                        { icon: ShieldAlert, label: t('landing.mockup.risk.sectorRisk'), value: t('landing.mockup.risk.medium'), color: 'warning', pct: 52 },
                        { icon: TrendingUp, label: t('landing.mockup.risk.survivalRate'), value: '86%', color: 'success', pct: 86 },
                        { icon: Activity, label: 'Volatilité', value: 'Faible', color: 'brand', pct: 28 },
                        { icon: PieChart, label: 'Score Global', value: '7.8/10', color: 'secondary', pct: 78 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.93 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06, duration: 0.2 }}
                          className="glass-card p-3.5 hover:border-brand/30 transition-all duration-200"
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 bg-${item.color}/10 border border-${item.color}/15`}>
                            <item.icon className={`w-4 h-4 text-${item.color}`} />
                          </div>
                          <span className="text-[10px] font-medium text-text-muted/60 block mb-1">{item.label}</span>
                          <div className={`text-xl font-black text-${item.color} mb-2`}>{item.value}</div>
                          <div className="h-1 rounded-full bg-border/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ delay: i * 0.06 + 0.1, duration: 0.4, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-${item.color}`}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};