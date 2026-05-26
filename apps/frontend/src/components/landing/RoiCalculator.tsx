import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Clock, Euro } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';

export const RoiCalculator = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [dossiers, setDossiers] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(150);
  const [complexity, setComplexity] = useState<'simple' | 'standard' | 'complexe'>('standard');
  
  // Complexity multipliers for manual vs AI hours
  const getComplexityHours = () => {
    switch (complexity) {
      case 'simple':
        return { manual: 8, ai: 2 };
      case 'standard':
        return { manual: 12, ai: 2 };
      case 'complexe':
        return { manual: 18, ai: 2 };
    }
  };

  const { manual: manualHoursPerDossier, ai: aiHoursPerDossier } = getComplexityHours();

  // Calculated values
  const hoursSavedPerMonth = (manualHoursPerDossier - aiHoursPerDossier) * dossiers;
  const hoursSavedPerYear = hoursSavedPerMonth * 12;
  const monetaryValueSaved = hoursSavedPerMonth * hourlyRate;
  const monetaryValueSavedPerYear = monetaryValueSaved * 12;

  // Real-time software subscription offset (199€/month) for ROI multiplier
  const baseCost = 199;
  const roiMultiplier = Math.max(1, Math.round(monetaryValueSaved / baseCost));

  // SVG Chart Geometry and Math scaling
  const graphWidth = 340;
  const graphHeight = 120;
  const xD = 40 + (dossiers / 50) * graphWidth;
  
  // Y coordinates corresponding to dossier times (mapped to max 900 hours, bounds: y=15 to y=135)
  const maxScaledHours = 900;
  const yManualD = 135 - ((dossiers * manualHoursPerDossier) / maxScaledHours) * graphHeight;
  const yAiD = 135 - ((dossiers * aiHoursPerDossier) / maxScaledHours) * graphHeight;

  // Tooltip anchor scaling
  const textAnchor = xD > 260 ? 'end' : 'start';
  const textOffset = xD > 260 ? -12 : 12;

  return (
    <section className="py-28 bg-slate-50 dark:bg-[#080D16] border-y border-slate-200 dark:border-white/10 relative overflow-hidden text-text-main dark:text-white transition-colors duration-300">
      {/* Decorative Overlapping Ambient Glows */}
      <div className="absolute top-1/4 left-[5%] w-[450px] h-[450px] bg-brand/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-[5%] w-[500px] h-[500px] bg-indigo-500/5 blur-[140px] pointer-events-none rounded-full" />
      
      {/* Subtle technical background grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: isDark 
            ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)' 
            : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Glowing Modern Section Header */}
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6 shadow-[inset_0_1px_0_rgba(0,209,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            ROI & Performance financière
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-text-main dark:text-white mb-6 tracking-tight leading-tight heading-serif">
            {t('landing.roi.title')}
          </h2>
          <p className="text-lg md:text-xl text-text-muted dark:text-slate-400 max-w-2xl mx-auto font-medium">
            {t('landing.roi.subtitle')}
          </p>
        </div>

        {/* Dynamic Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-[#0c1220]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_30px_90px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300">
          
          {/* Left: Tactile Controls Cockpit */}
          <div className="flex flex-col justify-between bg-slate-50/50 dark:bg-[#070b15]/75 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] relative overflow-hidden group transition-all duration-300">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand/5 blur-[40px] pointer-events-none" />
            
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  Simulateur Interactif
                </span>
                <div className="text-[10px] font-semibold text-brand/80 px-2.5 py-1 rounded-md bg-brand/10 border border-brand/20 tracking-wide uppercase">
                  Temps & Rentabilité
                </div>
              </div>

              <label className="text-text-main dark:text-white font-bold text-lg md:text-xl block leading-snug">
                {t('landing.roi.question')}
              </label>

              {/* Slider 1: Volume de dossiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted dark:text-slate-400">Volume mensuel</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-brand font-display tracking-tight drop-shadow-[0_0_12px_rgba(0,209,255,0.25)]">{dossiers}</span>
                    <span className="text-xs font-semibold text-text-muted dark:text-slate-400">dossiers / mois</span>
                  </div>
                </div>

                <div className="relative pt-2 pb-6">
                  <div className="absolute top-[18px] left-0 right-0 h-2 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 pointer-events-none" />
                  <div 
                    className="absolute top-[19px] left-0 h-1.5 rounded-full bg-gradient-to-r from-brand to-indigo-400 pointer-events-none shadow-[0_0_10px_rgba(0,209,255,0.4)]"
                    style={{ width: `${((dossiers - 1) / 49) * 100}%` }}
                  />

                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={dossiers} 
                    onChange={(e) => setDossiers(parseInt(e.target.value))}
                    className="absolute top-0 left-0 w-full h-8 cursor-pointer opacity-0 z-20"
                  />
                  
                  <div 
                    className="absolute w-5 h-5 rounded-full bg-white border-2 border-brand shadow-[0_0_15px_rgba(0,209,255,0.6)] top-[12px] -ml-2.5 pointer-events-none z-10 transition-all duration-75 group-hover:scale-110"
                    style={{ left: `${((dossiers - 1) / 49) * 100}%` }}
                  />

                  <div className="absolute top-[28px] left-0 right-0 flex justify-between px-1 pointer-events-none">
                    {[1, 10, 20, 30, 40, 50].map((tick) => (
                      <div key={tick} className="flex flex-col items-center">
                        <div className={`w-1 h-1.5 rounded-full transition-colors duration-200 ${dossiers >= tick ? 'bg-brand' : 'bg-slate-300/50 dark:bg-white/20'}`} />
                        <span className="text-[9px] text-text-muted dark:text-slate-400 mt-1.5 font-bold font-mono">{tick}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
 
              {/* Slider 2: Tarif Horaire Moyen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted dark:text-slate-400">Tarif horaire moyen</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-brand font-display tracking-tight drop-shadow-[0_0_12px_rgba(0,209,255,0.25)]">{hourlyRate}</span>
                    <span className="text-xs font-semibold text-text-muted dark:text-slate-400">€ / heure</span>
                  </div>
                </div>
 
                <div className="relative pt-2 pb-5">
                  <div className="absolute top-[18px] left-0 right-0 h-2 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 pointer-events-none" />
                  <div 
                    className="absolute top-[19px] left-0 h-1.5 rounded-full bg-gradient-to-r from-brand to-indigo-400 pointer-events-none shadow-[0_0_10px_rgba(0,209,255,0.4)]"
                    style={{ width: `${((hourlyRate - 50) / 250) * 100}%` }}
                  />
 
                  <input 
                    type="range" 
                    min="50" 
                    max="300" 
                    step="10"
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                    className="absolute top-0 left-0 w-full h-8 cursor-pointer opacity-0 z-20"
                  />
                  
                  <div 
                    className="absolute w-5 h-5 rounded-full bg-white border-2 border-brand shadow-[0_0_15px_rgba(0,209,255,0.6)] top-[12px] -ml-2.5 pointer-events-none z-10 transition-all duration-75 group-hover:scale-110"
                    style={{ left: `${((hourlyRate - 50) / 250) * 100}%` }}
                  />
 
                  <div className="absolute top-[28px] left-0 right-0 flex justify-between px-1 pointer-events-none">
                    {[50, 100, 150, 200, 250, 300].map((tick) => (
                      <div key={tick} className="flex flex-col items-center">
                        <div className={`w-1 h-1.5 rounded-full transition-colors duration-200 ${hourlyRate >= tick ? 'bg-brand' : 'bg-slate-300/50 dark:bg-white/20'}`} />
                        <span className="text-[9px] text-text-muted dark:text-slate-400 mt-1.5 font-bold font-mono">{tick}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
 
              {/* Switcher 3: Complexité des Dossiers */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-text-muted dark:text-slate-400 block">Complexité moyenne des dossiers</span>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-[#080d16]/80 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  {(['simple', 'standard', 'complexe'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setComplexity(level)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold tracking-wide transition-all uppercase duration-300 ${
                        complexity === level
                          ? 'bg-brand text-background shadow-[0_0_15px_rgba(0,209,255,0.35)] font-black'
                          : 'text-text-muted dark:text-slate-400 hover:text-text-main dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                      }`}
                    >
                      {level === 'simple' ? 'Simple' : level === 'standard' ? 'Standard' : 'Complexe'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
 
            {/* Tactical progress bar visualizations */}
            <div className="space-y-5 bg-slate-50 dark:bg-[#070b15]/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-inner mt-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-text-muted dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {t('landing.roi.manualTime')}
                  </span>
                  <span className="text-rose-500 font-bold font-mono">
                    {dossiers * manualHoursPerDossier} {t('landing.roi.perMonthHours')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200/40 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/30 dark:border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dossiers * manualHoursPerDossier / maxScaledHours) * 100}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-brand flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    {t('landing.roi.aiTime')}
                  </span>
                  <span className="text-brand font-extrabold font-mono">
                    {dossiers * aiHoursPerDossier} {t('landing.roi.perMonthHours')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200/40 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/30 dark:border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dossiers * aiHoursPerDossier / maxScaledHours) * 100}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    className="h-full bg-gradient-to-r from-brand to-indigo-400 shadow-[0_0_8px_rgba(0,209,255,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results Display & Dynamic Neon SVG Chart */}
          <div className="bg-slate-50/80 dark:bg-[#0a0f1d]/50 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_40px_rgba(15,23,42,0.03)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 blur-[80px] pointer-events-none" />
            
            {/* Top Section: Metrics Column & Floating ROI Badge */}
            <div className="space-y-6 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Rapport de performance
                </span>
                
                {/* Advanced ROI Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-extrabold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.15)] font-mono">
                  {roiMultiplier}x ROI ESTIMÉ
                </div>
              </div>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div 
                  key={hoursSavedPerYear}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="flex items-start gap-3 bg-white dark:bg-[#070b15]/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <div className="text-xs text-text-muted dark:text-slate-400 font-bold mb-0.5 uppercase tracking-wide">Économie de temps</div>
                    <div className="text-2xl md:text-3xl font-black text-text-main dark:text-white font-display tracking-tight tabular-nums">
                      {hoursSavedPerYear.toLocaleString()} <span className="text-xs text-text-muted dark:text-slate-400 font-bold">h / an</span>
                    </div>
                    <div className="text-[10px] text-text-muted dark:text-slate-400 mt-1 font-semibold">{hoursSavedPerMonth.toLocaleString()} heures saved / month</div>
                  </div>
                </motion.div>
  
                <motion.div 
                  key={monetaryValueSavedPerYear + "money"}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4, delay: 0.05 }}
                  className="flex items-start gap-3 bg-white dark:bg-[#070b15]/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                    <Euro className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-xs text-text-muted dark:text-slate-400 font-bold mb-0.5 uppercase tracking-wide">Gain de rentabilité</div>
                    <div className="text-2xl md:text-3xl font-black text-success font-display tracking-tight tabular-nums">
                      {monetaryValueSavedPerYear.toLocaleString(i18n.resolvedLanguage || 'fr-FR')} <span className="text-sm font-bold">€ / an</span>
                    </div>
                    <div className="text-[10px] text-text-muted dark:text-slate-400 mt-1 leading-none">{t('landing.roi.basedOn', { rate: hourlyRate })}</div>
                  </div>
                </motion.div>
              </div>
            </div>
  
            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-white/10 w-full relative z-10" />
  
            {/* Bottom Section: Dynamic Interactive SVG Chart */}
            <div className="w-full relative z-10 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] text-text-muted dark:text-slate-400 px-1 font-bold tracking-wider uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {t('landing.roi.manualTime')}
                </span>
                <span className="flex items-center gap-1.5 text-brand">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  {t('landing.roi.aiTime')}
                </span>
              </div>
              
              <div className="w-full bg-white dark:bg-[#070b15]/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-inner relative group/chart">
                <svg
                  viewBox="0 0 400 160"
                  className="w-full h-auto text-text-muted dark:text-slate-400"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="manual-grad" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F43F5E" />
                      <stop offset="100%" stopColor="#FDA4AF" />
                    </linearGradient>
                    <linearGradient id="ai-grad" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="savings-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1={40} y1={135} x2={380} y2={135} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                  <line x1={40} y1={75} x2={380} y2={75} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={40} y1={15} x2={380} y2={15} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Y-Axis Labels */}
                  <text x={32} y={138} fontSize="9" fill="currentColor" fillOpacity="0.4" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="700">0h</text>
                  <text x={32} y={78} fontSize="9" fill="currentColor" fillOpacity="0.4" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="700">450h</text>
                  <text x={32} y={18} fontSize="9" fill="currentColor" fillOpacity="0.4" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="700">900h</text>

                  {/* Vertical Gridlines & X-Axis Labels */}
                  {[10, 20, 30, 40, 50].map((d) => {
                    const xVal = 40 + (d / 50) * 340;
                    return (
                      <g key={d}>
                        <line x1={xVal} y1={15} x2={xVal} y2={135} stroke="currentColor" strokeOpacity="0.04" strokeWidth="1" />
                        <text x={xVal} y={148} fontSize="8" fill="currentColor" fillOpacity="0.35" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold">{d}</text>
                      </g>
                    );
                  })}
                  <text x={380} y={148} fontSize="8" fill="currentColor" fillOpacity="0.4" textAnchor="end" fontFamily="var(--font-sans)" fontWeight="bold">Dossiers</text>

                  {/* Shaded Savings Polygon Area */}
                  <path
                    d={`M 40 135 L ${xD} ${yAiD} L ${xD} ${yManualD} Z`}
                    fill="url(#savings-grad)"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Reference complete Curves (dotted lines) */}
                  <line 
                    x1={40} 
                    y1={135} 
                    x2={380} 
                    y2={135 - ((50 * manualHoursPerDossier) / maxScaledHours) * graphHeight} 
                    stroke="currentColor" 
                    strokeOpacity="0.12" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                    className="transition-all duration-300"
                  />
                  <line 
                    x1={40} 
                    y1={135} 
                    x2={380} 
                    y2={135 - ((50 * aiHoursPerDossier) / maxScaledHours) * graphHeight} 
                    stroke="currentColor" 
                    strokeOpacity="0.12" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                    className="transition-all duration-300"
                  />

                  {/* Active Highlighted Curves */}
                  <line
                    x1={40}
                    y1={135}
                    x2={xD}
                    y2={yManualD}
                    stroke="url(#manual-grad)"
                    strokeWidth="8"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                  <line
                    x1={40}
                    y1={135}
                    x2={xD}
                    y2={yManualD}
                    stroke="url(#manual-grad)"
                    strokeWidth="3.2"
                    strokeOpacity="0.95"
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                  
                  <line
                    x1={40}
                    y1={135}
                    x2={xD}
                    y2={yAiD}
                    stroke="url(#ai-grad)"
                    strokeWidth="8"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                  <line
                    x1={40}
                    y1={135}
                    x2={xD}
                    y2={yAiD}
                    stroke="url(#ai-grad)"
                    strokeWidth="3.2"
                    strokeOpacity="0.95"
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Vertical Tracking Cursor Line */}
                  <line
                    x1={xD}
                    y1={15}
                    x2={xD}
                    y2={135}
                    stroke={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Glowing Dots representing current slider values */}
                  <circle cx={xD} cy={yManualD} r="10" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeOpacity="0.22" className="transition-all duration-300 ease-out" />
                  <circle cx={xD} cy={yManualD} r="5" fill="#F43F5E" className="transition-all duration-300 ease-out" />
                  <circle cx={xD} cy={yManualD} r="2.2" fill="#FFFFFF" className="transition-all duration-300 ease-out" />

                  <circle cx={xD} cy={yAiD} r="10" fill="none" stroke="#10B981" strokeWidth="2.5" strokeOpacity="0.22" className="transition-all duration-300 ease-out" />
                  <circle cx={xD} cy={yAiD} r="5" fill="#10B981" className="transition-all duration-300 ease-out" />
                  <circle cx={xD} cy={yAiD} r="2.2" fill="#FFFFFF" className="transition-all duration-300 ease-out" />

                  {/* Dynamic Floating Badges */}
                  <text
                    x={xD + textOffset}
                    y={yManualD - 8}
                    fontSize="9.5"
                    fontWeight="800"
                    fill={isDark ? "#FDA4AF" : "#E11D48"}
                    textAnchor={textAnchor}
                    fontFamily="var(--font-display)"
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] dark:drop-shadow-none transition-all duration-300 ease-out"
                  >
                    {dossiers * manualHoursPerDossier}h
                  </text>
                  <text
                    x={xD + textOffset}
                    y={yAiD + 15}
                    fontSize="9.5"
                    fontWeight="800"
                    fill={isDark ? "#34D399" : "#059669"}
                    textAnchor={textAnchor}
                    fontFamily="var(--font-display)"
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] dark:drop-shadow-none transition-all duration-300 ease-out"
                  >
                    {dossiers * aiHoursPerDossier}h
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
