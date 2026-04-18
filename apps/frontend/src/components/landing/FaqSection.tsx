import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FaqSection = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = t('landing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section id="faq" className="py-24 bg-surface/50 border-t border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
            {t('landing.faq.title')}
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`card cursor-pointer transition-all ${openIndex === index ? 'border-brand/50 shadow-[0_4px_20px_rgba(0,209,255,0.1)]' : ''}`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-text-main text-lg">{faq.q}</h3>
                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-brand' : ''}`} />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-48 pt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-text-muted leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
