import { useTranslation } from 'react-i18next';
import { TrendingUp, Zap, LineChart, Brain, Clock, Presentation } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export const FeaturesSection = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <Clock className="w-7 h-7 text-brand group-hover:text-background transition-colors" />,
      title: t('landing.features.items.time.title'),
      description: t('landing.features.items.time.desc'),
      bgClass: "bg-brand/10 border-brand/20 group-hover:bg-brand"
    },
    {
      icon: <Brain className="w-7 h-7 text-success group-hover:text-background transition-colors" />,
      title: t('landing.features.items.reliability.title'),
      description: t('landing.features.items.reliability.desc'),
      bgClass: "bg-success/10 border-success/20 group-hover:bg-success"
    },
    {
      icon: <Presentation className="w-7 h-7 text-secondary group-hover:text-background transition-colors" />,
      title: t('landing.features.items.memorandum.title'),
      description: t('landing.features.items.memorandum.desc'),
      bgClass: "bg-secondary/10 border-secondary/20 group-hover:bg-secondary"
    },
    {
      icon: <Zap className="w-7 h-7 text-warning group-hover:text-background transition-colors" />,
      title: t('landing.features.items.realtime.title'),
      description: t('landing.features.items.realtime.desc'),
      bgClass: "bg-warning/10 border-warning/20 group-hover:bg-warning"
    },
    {
      icon: <LineChart className="w-7 h-7 text-brand group-hover:text-background transition-colors" />,
      title: t('landing.features.items.roi.title'),
      description: t('landing.features.items.roi.desc'),
      bgClass: "bg-brand/10 border-brand/20 group-hover:bg-brand"
    },
    {
      icon: <TrendingUp className="w-7 h-7 text-success group-hover:text-background transition-colors" />,
      title: t('landing.features.items.margin.title'),
      description: t('landing.features.items.margin.desc'),
      bgClass: "bg-success/10 border-success/20 group-hover:bg-success"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section id="features" className="py-24 bg-surface/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6 tracking-tight">
            {t('landing.features.title')}
          </h2>
          <p className="text-xl text-text-muted">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((b, index) => (
            <motion.div variants={itemVariants} key={index} className="glow-card group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-colors ${b.bgClass}`}>
                {b.icon}
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-4">{b.title}</h3>
              <p className="text-text-muted leading-relaxed">
                {b.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
