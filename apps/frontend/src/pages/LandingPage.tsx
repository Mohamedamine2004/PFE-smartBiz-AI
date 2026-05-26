import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { AIVisualizationSection } from '../components/landing/AIVisualizationSection';
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-driven progress bar
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 20);
      setShowBackToTop(el.scrollTop > 600);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="relative h-screen overflow-y-auto overflow-x-hidden bg-background flex flex-col font-sans transition-colors duration-300 scroll-smooth">
      
      {/* ── Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[9999] origin-left"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, var(--brand), var(--secondary), var(--brand))',
          backgroundSize: '200% 100%',
        }}
      />

      <LandingNavbar
        isScrolled={isScrolled}
        onOpenInvite={() => setIsInviteModalOpen(true)}
      />

      <main className="flex-1">
        <HeroSection onOpenInvite={() => setIsInviteModalOpen(true)} />
        <TrustLogosSection />
        <AIVisualizationSection />
        <HowItWorksSection />
        <StatsSection />
        <FeaturesSection />
        <RoiCalculator />
        <SecuritySection />
        <TestimonialsSection />
        <FaqSection />

        {/* ── Final CTA ── */}
        <section className="relative py-36 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,209,255,0.06) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/50 to-background" />

          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }}
          />

          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
            style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-text-main tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {t('landing.finalCta.title')}
              </h2>
              <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('landing.finalCta.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="btn-premium group px-12 py-6 text-lg flex items-center justify-center gap-3 mx-auto shadow-[0_10px_50px_rgba(0,209,255,0.3)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('landing.finalCta.button')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </button>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
      </main>

      <LandingFooter />

      {/* ── Back to Top ── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(0,209,255,0.25)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 20px rgba(0,209,255,0.08)',
            }}
          >
            <ArrowUp className="w-4 h-4 text-brand" />
          </motion.button>
        )}
      </AnimatePresence>

      <InvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};