import { ArrowRight, Sparkles, FileText, Star } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onOpenInvite: () => void;
}

export const HeroSection = ({ onOpenInvite }: HeroSectionProps) => {
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden flex flex-col items-center justify-center">
      {/* Background Gradients (Animated Orbs) */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3 pointer-events-none"
      />

      <motion.div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/20 bg-brand/5 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(0,209,255,0.1)]">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="text-sm font-semibold text-brand tracking-wide">
            {t('landing.hero.badge')}
          </span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tighter text-text-main mb-8 leading-[1.05]">
          {t('landing.hero.title1')} <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-secondary">
            {t('landing.hero.title2')}
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="max-w-2xl mx-auto text-xl md:text-2xl text-text-muted mb-12 leading-relaxed">
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {/* Pulsing Primary Button */}
          <button
            onClick={onOpenInvite}
            className="w-full sm:w-auto btn-primary px-10 py-5 text-lg flex items-center justify-center gap-3 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all duration-300 shadow-[0_8px_30px_rgba(0,209,255,0.25)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-2">
              {t('landing.hero.cta.primary')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Download Interactive Button */}
          <button
            onClick={() => { }} // Could link to a sample PDF
            className="w-full sm:w-auto px-10 py-5 bg-surface/50 backdrop-blur-sm text-text-main font-semibold rounded-lg border border-border/50 hover:border-brand/50 hover:bg-brand/5 transition-all flex items-center justify-center gap-3 text-lg shadow-sm group"
          >
            <FileText className="w-5 h-5 text-text-muted group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-300" /> {t('landing.hero.cta.secondary')}
          </button>
        </motion.div>

        {/* Fan Layout Social Proof with Stars */}
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-3 opacity-90 hover:opacity-100 transition-opacity cursor-pointer group">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-row -space-x-4 group-hover:-space-x-1 transition-all duration-500 ease-out">
              <img className="w-12 h-12 rounded-full border-2 border-background object-cover shadow-sm z-30 group-hover:-rotate-6 transition-transform duration-300" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
              <img className="w-12 h-12 rounded-full border-2 border-background object-cover shadow-sm z-20 group-hover:rotate-3 transition-transform duration-300" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
              <img className="w-12 h-12 rounded-full border-2 border-background object-cover shadow-sm z-10 group-hover:-rotate-3 transition-transform duration-300" src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" />
              <img className="w-12 h-12 rounded-full border-2 border-background object-cover shadow-sm z-0 group-hover:rotate-6 transition-transform duration-300" src="https://randomuser.me/api/portraits/men/46.jpg" alt="User" />
            </div>
            <div className="text-sm text-text-muted text-left leading-tight">
              <span className="font-bold text-text-main">{t('landing.hero.social.count')}</span> {t('landing.hero.social.text1')}<br />
              {t('landing.hero.social.text2')}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
