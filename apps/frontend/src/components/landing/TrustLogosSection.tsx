import { useTranslation } from 'react-i18next';

export const TrustLogosSection = () => {
  const { t } = useTranslation();
  const logos = [
    { name: "BNP Paribas", style: "font-serif italic tracking-tighter text-2xl" },
    { name: "KPMG", style: "font-sans font-black tracking-widest text-3xl" },
    { name: "Qonto", style: "font-sans font-bold tracking-tight text-3xl lowercase" },
    { name: "Lazard", style: "font-serif tracking-widest text-2xl uppercase" },
    { name: "Stripe", style: "font-sans font-black tracking-tighter text-3xl" }
  ];

  return (
    <section className="py-12 border-b border-border/50 bg-background relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-text-muted uppercase tracking-widest mb-8">
          {t('landing.trust.title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <div key={index} className={`text-text-main hover:text-text-main transition-colors duration-300 select-none ${logo.style}`}>
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
