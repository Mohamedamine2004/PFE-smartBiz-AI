import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { InteractiveMockup } from '../components/landing/InteractiveMockup';
import { TrustLogosSection } from '../components/landing/TrustLogosSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { RoiCalculator } from '../components/landing/RoiCalculator';
import { SecuritySection } from '../components/landing/SecuritySection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FaqSection } from '../components/landing/FaqSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { InvitationModal } from '../components/landing/InvitationModal';

export const LandingPage = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
      <LandingNavbar 
        isScrolled={isScrolled} 
        onOpenInvite={() => setIsInviteModalOpen(true)} 
      />
      
      <main className="flex-1">
        <HeroSection onOpenInvite={() => setIsInviteModalOpen(true)} />
        <TrustLogosSection />
        <InteractiveMockup />
        <HowItWorksSection />
        <StatsSection />
        <FeaturesSection />
        <RoiCalculator />
        <SecuritySection />
        <TestimonialsSection />
        <FaqSection />
        
        <section className="py-32 relative overflow-hidden bg-background">
          <div className="absolute inset-0 bg-brand/5 dark:bg-brand/10 border-y border-brand/10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-text-main tracking-tight">
              {t('landing.finalCta.title')}
            </h2>
            <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-2xl mx-auto">
              {t('landing.finalCta.subtitle')}
            </p>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="btn-primary px-12 py-6 text-xl shadow-[0_10px_40px_rgba(0,209,255,0.25)] hover:shadow-[0_15px_50px_rgba(0,209,255,0.4)] mx-auto"
            >
              {t('landing.finalCta.button')}
            </button>
          </div>
        </section>
      </main>

      <LandingFooter />

      <InvitationModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
    </div>
  );
};
