import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Sparkles, UserPlus, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onOpenInvite: () => void;
}

export const HeroSection = ({ onOpenInvite }: HeroSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  // Rotating words for line 2 of the hero section
  const words = [
    t('landing.hero.title2_1', 'nouvelle génération.'),
    t('landing.hero.title2_2', "augmentée par l'IA."),
    t('landing.hero.title2_3', 'précise & instantanée.'),
    t('landing.hero.title2_4', 'prête pour les investisseurs.'),
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3500); // 3.5s for comfortable reading
    return () => clearInterval(timer);
  }, [words.length]);

  const textRotatorVariants: Variants = {
    enter: {
      y: 40,
      opacity: 0,
    },
    center: {
      y: 0,
      opacity: 1,
      transition: {
        y: { type: 'spring', stiffness: 300, damping: 28 },
        opacity: { duration: 0.35 },
      },
    },
    exit: {
      y: -40,
      opacity: 0,
      transition: {
        y: { type: 'spring', stiffness: 300, damping: 28 },
        opacity: { duration: 0.35 },
      },
    },
  };

  // Scroll-driven parallax — read from the page container (closest scroll parent)
  const { scrollY } = useScroll();

  // Z-axis parallax: deeper layers move slower (positive = closer, moves faster up)
  const gridY     = useTransform(scrollY, [0, 600], [0, 80]);   // slowest — "far" grid
  const orb2Y     = useTransform(scrollY, [0, 600], [0, 160]);  // closer orb
  const orb3Y     = useTransform(scrollY, [0, 600], [0, 100]);  // accent orb
  const contentY  = useTransform(scrollY, [0, 600], [0, 40]);   // foreground content
  const opacityY  = useTransform(scrollY, [0, 400], [1, 0]);    // fade as user scrolls away

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  };

  const titleContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15
      }
    }
  };

  const wordRevealVariants: Variants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <section ref={sectionRef} className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden">

      {/* LAYER 0 — Deepest: static gradient mesh */}
      <div className="absolute inset-0 gradient-mesh" />

      {/* LAYER 1 — Slowest parallax: perspective grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          y: gridY,
          backgroundImage:
            'linear-gradient(rgba(0,209,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'perspective(800px) rotateX(20deg)',
          transformOrigin: 'center top',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}
      />

      {/* LAYER 2 — Mid parallax: ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-16 right-0 w-[560px] h-[560px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.14) 0%, transparent 70%)', filter: 'blur(70px)' }} />
      </motion.div>

      <motion.div
        style={{ y: orb2Y }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute bottom-16 left-0 w-[460px] h-[460px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(55px)' }} />
      </motion.div>

      <motion.div
        style={{ y: orb3Y }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.22, 0.1], x: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute top-1/3 left-1/3 w-[320px] h-[320px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </motion.div>

      {/* LAYER 3 — Floating micro-particles */}
      {[
        { top: '22%', left: '8%',  size: 'w-3 h-3',   shape: 'rounded-sm rotate-45', color: 'bg-brand/25',    delay: 0 },
        { top: '38%', right: '10%',size: 'w-2.5 h-2.5',shape: 'rounded-full',        color: 'bg-secondary/35',delay: -2 },
        { bottom: '28%', left: '15%',size: 'w-4 h-4',  shape: 'border border-brand/20',color: '',             delay: -4 },
        { top: '55%', right: '22%',size: 'w-1.5 h-1.5',shape: 'rounded-full',        color: 'bg-success/40',  delay: -6 },
      ].map((el, i) => (
        <motion.div
          key={i}
          animate={{ y: [-12, 12, -12], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: el.delay }}
          className={`absolute ${el.size} ${el.shape} ${el.color} pointer-events-none`}
          style={{ top: el.top, left: (el as { left?: string }).left, right: (el as { right?: string }).right, bottom: (el as { bottom?: string }).bottom }}
        />
      ))}

      {/* LAYER 4 — Foreground content: moves up slightly on scroll */}
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ y: contentY, opacity: opacityY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/25 bg-brand/6 backdrop-blur-md shadow-[0_0_24px_rgba(0,209,255,0.08)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-semibold text-brand tracking-wider uppercase">
              {t('landing.hero.badge')}
            </span>
            <ChevronRight className="w-3 h-3 text-brand/60" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8 flex flex-col items-center">
          <motion.h1
            variants={titleContainerVariants}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-text-main mb-5 leading-[1.1] md:leading-[1.04] flex flex-col items-center select-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {/* Line 1: Business valuation / Évaluation d'entreprise / تقييم الشركات */}
            <span className="flex flex-wrap justify-center gap-x-[0.25em] gap-y-[0.15em] overflow-hidden py-1.5 px-1">
              {t('landing.hero.title1').split(' ').map((word, idx) => (
                <span key={`t1-${idx}`} className="inline-block overflow-hidden pb-1 md:pb-2">
                  <motion.span variants={wordRevealVariants} className="inline-block">
                    {word}
                  </motion.span>
                </span>
              ))}
            </span>

            {/* Line 2: Rotating messages with animation */}
            <span className="relative grid place-items-center overflow-hidden py-1.5 px-1 min-h-[1.2em] w-full">
              <AnimatePresence>
                <motion.span
                  key={index}
                  variants={textRotatorVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="col-start-1 row-start-1 text-transparent bg-clip-text bg-gradient-to-r from-brand via-cyan-300 to-secondary bg-[length:200%_200%] animate-gradient flex flex-wrap justify-center gap-x-[0.25em] pb-1 md:pb-2 text-center"
                >
                  {words[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-text-muted leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={onOpenInvite}
            className="group relative w-full sm:w-auto px-9 py-4 text-base overflow-hidden rounded-2xl"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand via-cyan-400 to-brand bg-[length:200%_100%] animate-gradient" />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-brand opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2.5 font-semibold text-background">
              {t('landing.hero.cta.primary')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            </span>
          </button>

          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-9 py-4 bg-surface/60 backdrop-blur-md text-text-main font-semibold rounded-2xl border border-border/60 hover:border-brand/40 hover:bg-brand/8 transition-all duration-300 flex items-center justify-center gap-2.5 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
          >
            <UserPlus className="w-5 h-5 text-text-muted group-hover:text-brand transition-colors duration-200" />
            {t('landing.hero.cta.secondary')}
          </button>
        </motion.div>

        {/* Social Proof - Enhanced */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.div
                key={star}
                whileHover={{ scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex -space-x-3">
              {[
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/68.jpg',
                'https://randomuser.me/api/portraits/men/46.jpg',
              ].map((src, i) => (
                <motion.img
                  key={i}
                  whileHover={{ scale: 1.15, zIndex: 50 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-10 h-10 rounded-full border-3 border-background object-cover shadow-lg cursor-pointer"
                  style={{ zIndex: 4 - i }}
                  src={src}
                  alt="User"
                />
              ))}
              <div className="w-10 h-10 rounded-full border-3 border-background bg-elevated flex items-center justify-center text-xs font-bold text-text-muted" style={{ zIndex: 0 }}>
                +450
              </div>
            </div>
            <div className="text-sm text-text-muted text-center sm:text-left leading-snug">
              <span className="font-bold text-text-main">{t('landing.hero.social.count')}</span>{' '}
              {t('landing.hero.social.text1')}<br className="hidden sm:block" />
              {t('landing.hero.social.text2')}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue arrow */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        style={{ opacity: opacityY }}
      >
        <span className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border border-text-muted/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-brand" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};