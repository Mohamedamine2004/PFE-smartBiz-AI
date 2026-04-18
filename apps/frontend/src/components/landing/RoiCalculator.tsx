import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Clock, Euro } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RoiCalculator = () => {
  const { t, i18n } = useTranslation();
  const [dossiers, setDossiers] = useState(15);
  
  // Constants for calculation
  const HOURS_PER_DOSSIER_MANUAL = 12;
  const HOURS_PER_DOSSIER_AI = 2;
  const HOURLY_RATE = 150; // €/hour

  // Calculated values
  const hoursSavedPerMonth = (HOURS_PER_DOSSIER_MANUAL - HOURS_PER_DOSSIER_AI) * dossiers;
  const monetaryValueSaved = hoursSavedPerMonth * HOURLY_RATE;

  return (
    <section className="py-24 bg-surface/50 border-y border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
           <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand/10 text-brand mb-6 border border-brand/20">
              <Calculator className="w-8 h-8" />
           </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6 tracking-tight">
            {t('landing.roi.title')}
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            {t('landing.roi.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
          {/* Left: Interactive Controls */}
          <div className="flex flex-col justify-center">
             <label className="text-text-main font-semibold text-lg mb-6 block">
               {t('landing.roi.question')}
             </label>
             <div className="flex items-center gap-6 mb-8">
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={dossiers} 
                  onChange={(e) => setDossiers(parseInt(e.target.value))}
                  className="slider flex-1"
                />
                <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center text-2xl font-black text-brand shadow-inner">
                  {dossiers}
                </div>
             </div>
             
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted">{t('landing.roi.manualTime')}</span>
                 <span className="font-semibold text-text-main">{dossiers * HOURS_PER_DOSSIER_MANUAL}{t('landing.roi.perMonthHours')}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted text-brand font-medium">{t('landing.roi.aiTime')}</span>
                 <span className="font-bold text-brand">{dossiers * HOURS_PER_DOSSIER_AI}{t('landing.roi.perMonthHours')}</span>
               </div>
             </div>
          </div>

          {/* Right: Results Display */}
          <div className="bg-elevated border border-border rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center gap-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] pointer-events-none" />
            
            <motion.div 
              key={hoursSavedPerMonth}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="flex items-start gap-4"
            >
               <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-brand" />
               </div>
               <div>
                 <div className="text-sm text-text-muted font-medium mb-1">{t('landing.roi.timeSaved')}</div>
                 <div className="text-4xl font-black text-text-main tabular-nums">
                   {hoursSavedPerMonth} <span className="text-xl text-text-muted font-bold">{t('landing.roi.hours')}</span>
                 </div>
               </div>
            </motion.div>

            <motion.div 
              key={monetaryValueSaved + "money"}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="flex items-start gap-4"
            >
               <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                  <Euro className="w-6 h-6 text-success" />
               </div>
               <div>
                <div className="text-sm text-text-muted font-medium mb-1">{t('landing.roi.estimatedGain')}</div>
                 <div className="text-4xl font-black text-success tabular-nums">
                  {monetaryValueSaved.toLocaleString(i18n.resolvedLanguage || 'fr-FR')} <span className="text-xl text-success/70 font-bold">€</span>
                 </div>
                <div className="text-xs text-text-muted mt-2">{t('landing.roi.basedOn', { rate: '150€' })}</div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
