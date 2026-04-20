import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

interface PricingSectionProps {
  onOpenInvite: () => void;
}

export const PricingSection = ({ onOpenInvite }: PricingSectionProps) => {
  const { t } = useTranslation();
  const asStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

  const plans = [
    {
      name: t('landing.pricing.starter.name'),
      desc: t('landing.pricing.starter.desc'),
      price: t('landing.pricing.starter.price'),
      features: asStringArray(t('landing.pricing.starter.features', { returnObjects: true })),
      isPopular: false
    },
    {
      name: t('landing.pricing.expert.name'),
      desc: t('landing.pricing.expert.desc'),
      price: t('landing.pricing.expert.price'),
      features: asStringArray(t('landing.pricing.expert.features', { returnObjects: true })),
      isPopular: true
    },
    {
      name: t('landing.pricing.enterprise.name'),
      desc: t('landing.pricing.enterprise.desc'),
      price: t('landing.pricing.enterprise.price'),
      features: asStringArray(t('landing.pricing.enterprise.features', { returnObjects: true })),
      isPopular: false
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section className="py-32 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6 tracking-tight">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-xl text-text-muted">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto"
        >
          {plans.map((plan, i) => (
            <motion.div 
              variants={itemVariants}
              key={i} 
              className={`relative rounded-3xl p-8 transition-transform duration-300 ${
                plan.isPopular 
                  ? 'bg-surface border-2 border-brand shadow-[0_20px_80px_rgba(0,209,255,0.15)] md:-translate-y-4' 
                  : 'bg-transparent border border-border/60 hover:bg-surface hover:border-border'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-background px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase shadow-md">
                  {t('landing.pricing.recommended')}
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-text-main mb-2">{plan.name}</h3>
              <p className="text-text-muted text-sm mb-6 h-10">{plan.desc}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-black text-text-main">
                  {plan.price === 'Sur devis' || plan.price === 'On quote' ? plan.price : `€${plan.price}`}
                </span>
                {(plan.price !== 'Sur devis' && plan.price !== 'On quote') && (
                  <span className="text-text-muted font-medium"> {t('landing.pricing.perMonth')}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-text-muted text-sm font-medium">
                    <Check className="w-5 h-5 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button 
                onClick={onOpenInvite}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                  plan.isPopular 
                    ? 'btn-primary' 
                    : 'bg-elevated border border-border text-text-main hover:bg-border/50 hover:border-text-muted'
                }`}
              >
                {t('landing.pricing.cta')}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
