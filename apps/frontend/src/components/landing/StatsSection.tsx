import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView, animate } from 'framer-motion';

const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = "", prefix = "" }: { from?: number, to: number, duration?: number, suffix?: string, prefix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    
    const controls = animate(from, to, {
      duration: duration,
      ease: "easeOut",
      onUpdate(value) {
        if (nodeRef.current) {
          // Format based on value size to keep standard abbreviations (K, %, etc)
          const isFloat = !Number.isInteger(to) && to < 100;
          const formatted = isFloat ? value.toFixed(1) : Math.round(value).toLocaleString('fr-FR');
          nodeRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [from, to, duration, inView, prefix, suffix]);

  return <span ref={nodeRef} className="font-black">{prefix}{from}{suffix}</span>;
}

export const StatsSection = () => {
  const { t } = useTranslation();
  
  const stats = [
    { label: t('landing.stats.item1.label'), value: 12500, suffix: t('landing.stats.item1.suffix') },
    { label: t('landing.stats.item2.label'), value: 98.4, suffix: t('landing.stats.item2.suffix') },
    { label: t('landing.stats.item3.label'), value: 140, suffix: t('landing.stats.item3.suffix') },
    { label: t('landing.stats.item4.label'), value: 1.2, suffix: t('landing.stats.item4.suffix') }
  ];

  return (
    <section className="py-20 bg-background border-b border-border/50 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col items-center p-6 rounded-2xl hover:bg-surface/50 border border-transparent hover:border-text-muted/10 transition-colors"
            >
              <div className="text-4xl md:text-5xl text-brand mb-2 tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(0,209,255,0.2)]">
                <AnimatedCounter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm md:text-base font-semibold text-text-muted uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
