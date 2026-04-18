import { useState, useEffect } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'testimonials', 'faq'];
      let current = '';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider section active if it's within the top part of the viewport
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
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
    <nav 
      className={`fixed z-50 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'top-4 left-4 right-4 md:left-8 md:right-8 max-w-7xl mx-auto rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' 
          : 'top-0 left-0 right-0 bg-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center h-full py-2 sm:py-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img 
              src={theme === 'dark' ? logoDark : logoLight} 
              alt="SmartBiz AI" 
              className="h-full w-auto object-contain transition-all hover:scale-105 duration-300"
            />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.id}
                href={`#${link.id}`} 
                className={`text-sm font-medium transition-colors relative py-2 ${
                  activeSection === link.id ? 'text-brand' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-text-muted hover:bg-elevated hover:text-text-main transition-colors"
              title={t('landing.nav.changeLanguage')}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-muted hover:bg-elevated hover:text-text-main transition-colors"
              title={t('landing.nav.toggleTheme')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block text-sm font-medium text-text-main hover:text-brand transition-colors px-4 py-2"
            >
              {t('landing.nav.login')}
            </button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenInvite}
              className="btn-primary relative overflow-hidden group shadow-lg shadow-brand/20"
            >
              <span className="relative z-10">{t('landing.nav.invite')}</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-45deg] transition-all duration-700 ease-out group-hover:translate-x-[150%]" />
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};
