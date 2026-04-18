import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Cpu, Presentation } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <FileSpreadsheet className="w-8 h-8 text-brand" />,
      title: t('landing.howItWorks.step1.title'),
      description: t('landing.howItWorks.step1.desc')
    },
    {
      icon: <Cpu className="w-8 h-8 text-secondary" />,
      title: t('landing.howItWorks.step2.title'),
      description: t('landing.howItWorks.step2.desc')
    },
    {
      icon: <Presentation className="w-8 h-8 text-success" />,
      title: t('landing.howItWorks.step3.title'),
      description: t('landing.howItWorks.step3.desc')
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6 tracking-tight">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-xl text-text-muted">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Ligne connectrice animée (Desktop) */}
          <div className="hidden md:block absolute top-[48px] left-[16%] right-[16%] h-[2px] z-0">
             <svg width="100%" height="2" className="absolute inset-0">
               <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" className="text-border" strokeWidth="2" strokeDasharray="6 6" />
               <motion.line 
                 x1="0" y1="1" x2="100%" y2="1" 
                 stroke="currentColor" 
                 className="text-brand drop-shadow-[0_0_10px_rgba(0,209,255,1)]" 
                 strokeWidth="2" 
                 strokeDasharray="100%" 
                 strokeDashoffset="100%"
                 initial={{ strokeDashoffset: "100%" }}
                 whileInView={{ strokeDashoffset: "0%" }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
               />
             </svg>
          </div>

          {steps.map((step, index) => (
            <motion.div variants={itemVariants} key={index} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-surface border-2 border-border shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center mb-8 group-hover:-translate-y-2 transition-all duration-300 group-hover:border-brand/50 group-hover:shadow-[0_10px_40px_rgba(0,209,255,0.15)] relative">
                {/* Glow discret */}
                <div className="absolute inset-0 bg-brand/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-4">{step.title}</h3>
              <p className="text-text-muted leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
