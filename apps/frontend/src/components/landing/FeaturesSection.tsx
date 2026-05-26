import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Zap, LineChart, Brain, Clock, Presentation, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const FEATURE_ITEMS = [
  { iconComponent: Clock,        color: 'brand',     num: '01', colorHex: '#00D1FF' },
  { iconComponent: Brain,        color: 'success',   num: '02', colorHex: '#10B981' },
  { iconComponent: Presentation, color: 'secondary', num: '03', colorHex: '#6366F1' },
  { iconComponent: Zap,          color: 'warning',   num: '04', colorHex: '#F59E0B' },
  { iconComponent: LineChart,    color: 'brand',     num: '05', colorHex: '#00D1FF' },
  { iconComponent: TrendingUp,   color: 'success',   num: '06', colorHex: '#10B981' },
];

const bentoSpanClasses = [
  "md:col-span-2 md:row-span-1", // Card 1 (Large)
  "md:col-span-1 md:row-span-1", // Card 2 (Standard)
  "md:col-span-1 md:row-span-1", // Card 3 (Standard)
  "md:col-span-2 md:row-span-1", // Card 4 (Large)
  "md:col-span-2 md:row-span-1", // Card 5 (Large)
  "md:col-span-1 md:row-span-1", // Card 6 (Standard)
];

/* ── Individual card with Bento + Spotlight Mouse Hover ── */
const FeatureCard = ({
  item,
  titleKey,
  descKey,
  index,
  className = "",
}: {
  item: (typeof FEATURE_ITEMS)[number];
  titleKey: string;
  descKey: string;
  index: number;
  className?: string;
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });
  const Icon = item.iconComponent;

  // Staggered reveal delay
  const delay = (index % 3) * 0.1 + Math.floor(index / 3) * 0.05;

  // Spotlight Mouse Coordinates
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 35, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      onMouseMove={handleMouseMove}
      className={`feature-card group cursor-default transition-all duration-300 ${className}`}
    >
      {/* ── Dynamic Spotlight Glow (Behind Content) ── */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{
          background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${item.colorHex}15, transparent 80%)`,
        }}
      />

      {/* Top shimmer line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px z-10"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
        style={{
          background: `linear-gradient(90deg, transparent, ${item.colorHex}, transparent)`,
          transformOrigin: 'left',
        }}
      />

      <div className="relative z-10 flex items-start justify-between mb-5">
        <motion.div
          className="w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300"
          style={{
            background: `${item.colorHex}12`,
            borderColor: `${item.colorHex}20`,
            color: item.colorHex,
          }}
          whileHover={{
            background: item.colorHex,
            scale: 1.05,
          }}
        >
          <Icon className="w-6 h-6 transition-colors duration-300" />
        </motion.div>
        <span className="text-[10px] font-mono text-text-muted/30 font-bold mt-1 group-hover:text-brand/40 transition-colors">
          {item.num}
        </span>
      </div>

      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-bold text-text-main group-hover:text-brand transition-colors duration-200" style={{ fontFamily: 'var(--font-display)' }}>
          {t(titleKey)}
        </h3>
        <p className="text-text-muted leading-relaxed text-sm">
          {t(descKey)}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-1.5 mt-5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
        <span className="text-xs font-semibold text-brand">En savoir plus</span>
        <ArrowRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Bottom border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none z-0">
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />
      </div>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const orbY  = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ['15%', '-10%']);

  const benefitKeys = [
    { titleKey: 'landing.features.items.time.title',        descKey: 'landing.features.items.time.desc' },
    { titleKey: 'landing.features.items.reliability.title', descKey: 'landing.features.items.reliability.desc' },
    { titleKey: 'landing.features.items.memorandum.title',  descKey: 'landing.features.items.memorandum.desc' },
    { titleKey: 'landing.features.items.realtime.title',    descKey: 'landing.features.items.realtime.desc' },
    { titleKey: 'landing.features.items.roi.title',         descKey: 'landing.features.items.roi.desc' },
    { titleKey: 'landing.features.items.margin.title',      descKey: 'landing.features.items.margin.desc' },
  ];

  return (
    <section ref={sectionRef} id="features" className="relative py-28 overflow-hidden">
      {/* Background orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          y: orbY,
          background: 'radial-gradient(circle, rgba(0,209,255,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          y: orbY2,
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="absolute inset-0 bg-surface/50 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-elevated/50 text-text-muted text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            {t('landing.features.badge', 'Fonctionnalités')}
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-text-main mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('landing.features.title')}
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURE_ITEMS.map((item, index) => (
            <FeatureCard
              key={item.num}
              item={item}
              titleKey={benefitKeys[index].titleKey}
              descKey={benefitKeys[index].descKey}
              index={index}
              className={bentoSpanClasses[index]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};