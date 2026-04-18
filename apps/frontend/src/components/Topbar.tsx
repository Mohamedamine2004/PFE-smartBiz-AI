import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Moon, Sun, Globe, Menu } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <>
      {/* Mobile topbar (classic sticky) */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface/80 backdrop-blur-xl px-4">
         <button onClick={onToggleSidebar} className="p-2 text-text-muted hover:bg-elevated rounded-xl">
           <Menu className="h-5 w-5" />
         </button>
         <div className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand to-text-main">
           SmartBiz <span className="text-brand">AI</span>
         </div>
         <button onClick={logout} className="p-2 text-error"><LogOut className="h-5 w-5" /></button>
      </div>

      {/* Desktop Dynamic Island */}
      <div className="hidden lg:flex fixed top-6 left-1/2 -translate-x-[40%] z-50 justify-center">
        <motion.div
          layout
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          initial={{ borderRadius: 64 }}
          animate={{
            width: isExpanded ? 480 : 180,
            borderRadius: isExpanded ? 32 : 64,
          }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          className="bg-surface/90 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col justify-center px-2 py-1.5 cursor-default relative"
          style={{ minHeight: 56 }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />

          <div className="flex items-center justify-between w-full px-2 relative z-10">
            <motion.div layout className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand to-brand/40 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand/20 border border-brand/50">
                <User className="h-5 w-5" />
              </div>
              <motion.div layout className="flex flex-col justify-center">
                <motion.span layout="position" className="text-[13px] font-bold text-text-main leading-tight whitespace-nowrap">
                  {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                </motion.span>
                <AnimatePresence>
                  {!isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-brand font-bold uppercase tracking-widest whitespace-nowrap"
                    >
                      En Ligne
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.1 } }}
                  className="flex items-center gap-1.5"
                >
                  <div className="h-8 w-px bg-border/60 mx-1" />
                  
                  <div className="flex items-center text-text-muted hover:text-text-main transition-colors bg-elevated/50 rounded-full px-3 py-2 shadow-inner border border-white/5">
                    <Globe className="h-4 w-4 mr-1.5 text-brand" />
                    <select
                      onChange={changeLanguage}
                      value={i18n.language}
                      className="bg-transparent border-none text-[11px] font-bold text-text-main focus:ring-0 cursor-pointer outline-none appearance-none"
                    >
                      <option value="fr">FR</option>
                      <option value="en">EN</option>
                      <option value="ar">AR</option>
                    </select>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="p-2 text-text-muted hover:text-amber-400 bg-elevated/50 hover:bg-elevated rounded-full transition-all duration-200 shadow-inner border border-white/5 mx-1"
                    aria-label="Thème"
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />}
                  </button>

                  <button
                    onClick={logout}
                    className="p-2 text-error/80 hover:text-white hover:bg-error rounded-full transition-all duration-200 shadow-inner border border-white/5 ml-1"
                    title={t('topbar.logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Expanded detailed info */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2 pt-4 w-full relative z-10"
              >
                 <div className="bg-elevated/40 rounded-[20px] p-3 border border-border/40 flex items-center justify-between shadow-inner">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-0.5">Session Active</p>
                      <p className="text-xs text-text-main font-semibold">{user?.email}</p>
                    </div>
                    <div className="px-2.5 py-1.5 bg-brand/10 border border-brand/20 text-brand text-[10px] uppercase font-bold rounded-lg shadow-sm">
                      Espace Sécurisé
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};