import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoLight from '../../assets/logol.svg';
import logoDark from '../../assets/logod.svg';

interface LandingNavbarProps {
  isScrolled: boolean;
  onOpenInvite: () => void;
}

export const LandingNavbar = ({ isScrolled, onOpenInvite }: LandingNavbarProps) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'testimonials', 'faq'];
      let current = '';
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) current = section;
        }
      }
      setActiveSection(current);
      setVisible(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const order: Array<'fr' | 'en' | 'ar'> = ['fr', 'en', 'ar'];
    const current = (i18n.resolvedLanguage || 'fr') as 'fr' | 'en' | 'ar';
    const next = order[(order.indexOf(current) + 1) % order.length];
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const navLinks = [
    { id: 'features', label: t('landing.nav.features') },
    { id: 'testimonials', label: t('landing.nav.testimonials') },
    { id: 'faq', label: t('landing.nav.faq') }
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="navbar"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-50 top-3 left-4 right-4 md:left-6 md:right-6 max-w-7xl mx-auto"
        >
          <div
            className={`
              relative rounded-2xl border transition-all duration-200
              ${isScrolled
                ? 'bg-surface/85 backdrop-blur-2xl border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,209,255,0.04)]'
                : 'bg-surface/60 backdrop-blur-xl border-border/20 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
              }
            `}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent rounded-full" />

            <div className="px-4 sm:px-6">
              <div className="flex h-[60px] items-center justify-between gap-4">

                {/* Logo */}
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2.5 group shrink-0"
                >
                  <div className="relative">
                    <img
                      src={theme === 'dark' ? logoDark : logoLight}
                      alt="SmartBiz AI"
                      className="h-8 w-auto object-contain transition-all duration-200 group-hover:scale-105"
                    />
                    <div className="absolute -inset-1.5 bg-brand/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </button>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className={`
                        relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150
                        ${activeSection === link.id
                          ? 'text-brand bg-brand/8'
                          : 'text-text-muted hover:text-text-main hover:bg-elevated/60'
                        }
                      `}
                    >
                      {link.label}
                      {activeSection === link.id && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute bottom-0.5 left-3 right-3 h-[1.5px] bg-brand rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </a>
                  ))}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Language Toggle */}
                  <button
                    onClick={toggleLanguage}
                    className="p-2 rounded-lg text-text-muted hover:bg-elevated hover:text-text-main transition-all duration-150 border border-transparent hover:border-border/50"
                    title={t('landing.nav.changeLanguage')}
                  >
                    <Globe className="w-[18px] h-[18px]" />
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-text-muted hover:bg-elevated hover:text-text-main transition-all duration-150 border border-transparent hover:border-border/50"
                    title={t('landing.nav.toggleTheme')}
                  >
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18 }}
                    >
                      {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                    </motion.div>
                  </button>

                  {/* Login — Desktop */}
                  <button
                    onClick={() => navigate('/login')}
                    className="hidden sm:block text-sm font-medium text-text-muted hover:text-text-main transition-colors px-3 py-1.5 rounded-lg hover:bg-elevated/60"
                  >
                    {t('landing.nav.login')}
                  </button>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onOpenInvite}
                    className="relative overflow-hidden flex items-center gap-1.5 bg-brand text-background text-sm font-semibold px-4 py-2 rounded-xl shadow-[0_2px_12px_rgba(0,209,255,0.3)] transition-all duration-150 hover:shadow-[0_4px_20px_rgba(0,209,255,0.45)] group"
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span className="relative z-10">{t('landing.nav.invite')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] transition-all duration-500 ease-out group-hover:translate-x-[150%]" />
                  </motion.button>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-text-muted hover:bg-elevated hover:text-text-main transition-colors"
                  >
                    <div className="w-4 space-y-[4.5px]">
                      <motion.span
                        animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 5.5 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="block w-4 h-[1.5px] bg-current rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: isMobileMenuOpen ? 0 : 1, scaleX: isMobileMenuOpen ? 0 : 1 }}
                        transition={{ duration: 0.15 }}
                        className="block w-4 h-[1.5px] bg-current rounded-full"
                      />
                      <motion.span
                        animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -5.5 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="block w-4 h-[1.5px] bg-current rounded-full"
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="md:hidden border-t border-border/30 overflow-hidden rounded-b-2xl"
                >
                  <div className="px-4 py-3 space-y-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          activeSection === link.id
                            ? 'text-brand bg-brand/8'
                            : 'text-text-muted hover:text-text-main hover:bg-elevated/60'
                        }`}
                      >
                        {link.label}
                      </a>
                    ))}
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-main hover:bg-elevated/60 transition-colors"
                    >
                      {t('landing.nav.login')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};