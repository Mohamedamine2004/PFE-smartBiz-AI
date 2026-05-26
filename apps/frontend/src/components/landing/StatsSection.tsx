import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';

const AnimatedCounter = ({
  from = 0, to, duration = 1.4, suffix = '', prefix = '',
}: {
  from?: number; to: number; duration?: number; suffix?: string; prefix?: string;
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration,
      ease: 'easeOut',
      onUpdate(value) {
        if (nodeRef.current) {
          const isFloat = !Number.isInteger(to) && to < 100;
          const formatted = isFloat ? value.toFixed(1) : Math.round(value).toLocaleString('fr-FR');
          nodeRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [from, to, duration, inView, prefix, suffix]);

  return <span ref={nodeRef} className="font-black">{prefix}{from}{suffix}</span>;
};

export const StatsSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax glow moves opposite to scroll — creates Z-axis depth
  const glowY = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);
  const glowX = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);

  const stats = [
    { label: t('landing.stats.item1.label'), value: 12500, suffix: t('landing.stats.item1.suffix'), colorHex: '#00D1FF' },
    { label: t('landing.stats.item2.label'), value: 98.4,  suffix: t('landing.stats.item2.suffix'), colorHex: '#10B981' },
    { label: t('landing.stats.item3.label'), value: 140,   suffix: t('landing.stats.item3.suffix'), colorHex: '#6366F1' },
    { label: t('landing.stats.item4.label'), value: 1.2,   suffix: t('landing.stats.item4.suffix'), colorHex: '#00D1FF' },
  ];

  return (
    <section ref={sectionRef} className="relative py-16 bg-background border-y border-border/50 overflow-hidden">
      {/* Scroll-driven parallax glow — creates depth */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          y: glowY,
          x: glowX,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,209,255,0.04) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/50">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center px-4 py-8 md:px-8 text-center group hover:bg-surface/30 transition-colors duration-200"
            >
              {/* Value */}
              <div
                className="text-3xl md:text-4xl mb-2 tabular-nums tracking-tighter font-black transition-all duration-300"
                style={{
                  color: stat.colorHex,
                  filter: `drop-shadow(0 0 16px ${stat.colorHex}60)`,
                }}
              >
                <AnimatedCounter to={stat.value} suffix={stat.suffix} duration={1.6} />
              </div>

              {/* Label */}
              <div className="text-xs md:text-sm font-semibold text-text-muted uppercase tracking-wider">
                {stat.label}
              </div>

              {/* Animated underline on hover */}
              <div
                className="mt-3 h-px w-0 group-hover:w-12 transition-all duration-300 rounded-full"
                style={{ background: stat.colorHex }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
