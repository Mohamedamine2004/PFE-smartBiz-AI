import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqSection = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = t('landing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const safeFaqs = Array.isArray(faqs) ? faqs : [];

  return (
    <section id="faq" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-surface/20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-elevated/50 text-text-muted text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-1 h-1 rounded-full bg-brand" />
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-main tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {t('landing.faq.title')}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {safeFaqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`faq-item cursor-pointer ${openIndex === index ? 'border-brand/35 bg-brand/[0.02]' : ''}`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-text-muted/30 shrink-0 font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-semibold text-text-main text-base leading-snug">
                    {faq.q}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="shrink-0"
                >
                  <Plus className={`w-4 h-4 transition-colors ${openIndex === index ? 'text-brand' : 'text-text-muted'}`} />
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pl-[52px]">
                      <p className="text-text-muted leading-relaxed text-sm">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};