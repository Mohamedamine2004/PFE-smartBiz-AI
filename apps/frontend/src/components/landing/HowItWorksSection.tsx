import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Cpu, Presentation, CheckCircle2 } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const STEPS_DATA = [
  {
    icon: FileSpreadsheet,
    num: '01',
    accentColor: '#00D1FF',
    glowColor: 'rgba(0,209,255,0.15)',
    titleKey: 'landing.howItWorks.step1.title',
    descKey: 'landing.howItWorks.step1.desc',
    details: ['CSV, Excel, ERP sync', 'Auto data validation', 'Historical normalization'],
  },
  {
    icon: Cpu,
    num: '02',
    accentColor: '#6366F1',
    glowColor: 'rgba(99,102,241,0.15)',
    titleKey: 'landing.howItWorks.step2.title',
    descKey: 'landing.howItWorks.step2.desc',
    details: ['CatBoost + XGBoost fusion', 'Monte Carlo simulations', '28 sector benchmarks'],
  },
  {
    icon: Presentation,
    num: '03',
    accentColor: '#10B981',
    glowColor: 'rgba(16,185,129,0.15)',
    titleKey: 'landing.howItWorks.step3.title',
    descKey: 'landing.howItWorks.step3.desc',
    details: ['PDF in < 60 seconds', 'Charts, tables, annexes', 'Multi-language output'],
  },
];

/* ── Single step card with scroll-driven reveal ── */
const StepCard = ({
  step,
  index,
}: {
  step: (typeof STEPS_DATA)[number];
  index: number;
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60, scale: 0.95 }}
      animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="relative flex flex-col md:flex-row items-center gap-8 md:gap-14"
    >
      {/* Step number — large editorial */}
      <div
        className="hidden lg:flex shrink-0 w-20 text-right"
        aria-hidden
      >
        <span
          className="text-[56px] font-black leading-none select-none"
          style={{ color: step.accentColor, opacity: 0.18, fontVariantNumeric: 'tabular-nums' }}
        >
          {step.num}
        </span>
      </div>

      {/* Icon orb */}
      <motion.div
        animate={inView ? { boxShadow: `0 0 40px ${step.glowColor}` } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="shrink-0 relative w-[88px] h-[88px] rounded-3xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${step.glowColor}, rgba(0,0,0,0.2))`,
          border: `1.5px solid ${step.accentColor}30`,
        }}
      >
        {/* Animated ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={inView ? { scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ border: `1.5px solid ${step.accentColor}`, borderRadius: '24px' }}
        />
        <Icon className="w-9 h-9" style={{ color: step.accentColor, filter: `drop-shadow(0 0 8px ${step.accentColor}80)` }} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 text-center md:text-left">
        <motion.p
          className="text-[11px] font-bold uppercase tracking-widest mb-2"
          style={{ color: step.accentColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {t('landing.howItWorks.step', 'Étape')} {step.num}
        </motion.p>
        <motion.h3
          className="text-2xl md:text-3xl font-bold text-text-main mb-3 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          {t(step.titleKey)}
        </motion.h3>
        <motion.p
          className="text-text-muted leading-relaxed mb-4 max-w-md"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          {t(step.descKey)}
        </motion.p>

        {/* Detail pills */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center md:justify-start"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {step.details.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `${step.accentColor}12`,
                border: `1px solid ${step.accentColor}25`,
                color: step.accentColor,
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              {d}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ── Scroll-driven connector line ── */
const ScrollLine = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 30%'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="hidden lg:block absolute left-[128px] top-[80px] bottom-[80px] w-px" style={{ background: 'var(--border-color)' }}>
      <motion.div
        className="absolute inset-0 origin-top rounded-full"
        style={{
          scaleY,
          background: 'linear-gradient(to bottom, #00D1FF, #6366F1, #10B981)',
        }}
      />
    </div>
  );
};

export const HowItWorksSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Subtle parallax on the section background
  const bgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section ref={sectionRef} className="py-32 bg-background relative overflow-hidden">
      {/* Parallax background mesh */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          y: bgY,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(0,209,255,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-elevated/50 text-text-muted text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-1 h-1 rounded-full bg-brand" />
            {t('landing.howItWorks.badge', 'Comment ça marche')}
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-text-main mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-lg text-text-muted leading-relaxed">
            {t('landing.howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Steps — scrollytelling vertical list with connecting line */}
        <div className="relative">
          <ScrollLine />
          <div className="flex flex-col gap-20 lg:gap-24">
            {STEPS_DATA.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
