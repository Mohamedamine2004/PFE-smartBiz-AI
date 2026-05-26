import { Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const TestimonialsSection = () => {
  const { t } = useTranslation();
  const translated = t('landing.testimonials.items', { returnObjects: true }) as Array<{
    name: string;
    role: string;
    content: string;
  }>;
  const safeItems = Array.isArray(translated) ? translated : [];

  const avatars = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/46.jpg',
  ];

  const testimonials = safeItems.map((item, index) => ({
    ...item,
    avatar: avatars[index] || avatars[0],
    stars: 5,
  }));

  return (
    <section id="testimonials" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-surface/30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-elevated/50 text-text-muted text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-1 h-1 rounded-full bg-brand" />
            {t('landing.testimonials.title')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {t('landing.testimonials.title')}
          </h2>
          <p className="text-lg text-text-muted">
            {t('landing.testimonials.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="testimonial-card group h-full flex flex-col"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: item.stars }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="absolute top-5 right-5 w-8 h-8 text-brand/12 group-hover:text-brand/25 transition-colors duration-200" />

              {/* Content */}
              <p className="text-text-muted leading-relaxed text-sm italic flex-1 mb-5">
                "{item.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="relative shrink-0">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-brand/20 shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-text-main text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-text-muted truncate">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};