import { Shield, Lock, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const SecuritySection = () => {
  const { t } = useTranslation();

  const items = [
    { icon: Shield, color: 'brand', titleKey: 'landing.security.items.compliance.title', descKey: 'landing.security.items.compliance.desc' },
    { icon: Lock, color: 'success', titleKey: 'landing.security.items.encryption.title', descKey: 'landing.security.items.encryption.desc' },
    { icon: Server, color: 'secondary', titleKey: 'landing.security.items.sovereignty.title', descKey: 'landing.security.items.sovereignty.desc' },
  ];

  return (
    <section className="relative py-16 overflow-hidden border-y border-brand/10">
      {/* Subtle brand background */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/[0.04] via-brand/[0.06] to-secondary/[0.04]" />
      <div className="absolute inset-0 bg-background/60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center p-6 rounded-2xl hover:bg-surface/40 transition-colors duration-200 group"
            >
              <div className={`w-14 h-14 rounded-xl bg-surface border border-${item.color}/20 flex items-center justify-center mb-5 shadow-[0_0_24px_rgba(0,209,255,0.08)] group-hover:border-${item.color}/40 transition-all duration-200`}>
                <item.icon className={`w-6 h-6 text-${item.color}`} />
              </div>
              <h4 className="font-bold text-text-main text-base mb-1.5">{t(item.titleKey)}</h4>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs">{t(item.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
