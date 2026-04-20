import { Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  }));

  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
            {t('landing.testimonials.title')}
          </h2>
          <p className="text-lg text-text-muted">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="card relative group hover:-translate-y-1 transition-all">
              <Quote className="absolute top-6 right-6 w-8 h-8 text-brand/20 group-hover:text-brand/40 transition-colors" />
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={t.avatar} 
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-text-main">{t.name}</h4>
                  <p className="text-sm text-text-muted">{t.role}</p>
                </div>
              </div>
              <p className="text-text-main leading-relaxed italic">
                "{t.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
