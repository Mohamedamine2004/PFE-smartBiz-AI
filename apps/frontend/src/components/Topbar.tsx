import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Moon, Sun, Globe, Menu, Building } from 'lucide-react';
import { CompanySwitcherModal } from './CompanySwitcherModal';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const collapsedWidth = user?.role === 'OWNER' ? 220 : user?.role === 'ADMIN' ? 190 : 180;

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <>
      {/* Mobile topbar (classic sticky) */}
      <div className="no-print lg:hidden sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4">
        <button onClick={onToggleSidebar} className="p-2 text-text-muted hover:bg-elevated rounded-xl">
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand to-text-main">
          SmartBiz <span className="text-brand">AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl transition-all duration-200"
            title={t('topbar.switchCompany', 'Changer d\'entreprise')}
          >
            <Building className="h-5 w-5 text-brand" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl transition-all duration-200"
            title={theme === 'dark' ? t('topbar.lightMode', 'Mode Clair') : t('topbar.darkMode', 'Mode Sombre')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500 animate-[spin_20s_linear_infinite]" /> : <Moon className="h-5 w-5 text-indigo-500" />}
          </button>
          <button onClick={logout} className="p-2 text-error"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Desktop Dynamic Island */}
      <div className="no-print hidden lg:flex fixed top-6 left-1/2 -translate-x-[40%] z-50 justify-center">
        <motion.div
          layout
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          initial={{ borderRadius: 64 }}
          animate={{
            width: isExpanded ? 520 : collapsedWidth,
            borderRadius: isExpanded ? 32 : 64,
          }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          className="bg-surface border border-white/10 dark:border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col justify-center px-2 py-1.5 cursor-default relative group"
          style={{ minHeight: 56 }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />

          <div className="flex items-center justify-between w-full px-2 relative z-10">
            <motion.div layout className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="p-[1.5px] rounded-full bg-gradient-to-br from-brand/40 to-secondary/40 group-hover:from-brand group-hover:to-secondary transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.15)] group-hover:shadow-[0_0_12px_rgba(0,209,255,0.35)]">
                  <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-surface relative">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand via-brand/80 to-secondary flex items-center justify-center">
                        <span className="text-xs font-extrabold text-white">
                          {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 z-20">
                  <div className="absolute w-full h-full rounded-full bg-brand animate-ping opacity-75" />
                  <div className="absolute w-full h-full rounded-full bg-brand border border-background shadow-[0_0_8px_rgba(0,209,255,0.8)]" />
                </div>
              </div>
              <motion.div layout className="flex flex-col justify-center">
                <motion.span layout="position" className="text-[13px] font-bold text-text-main leading-tight whitespace-nowrap">
                  {user?.role === 'OWNER'
                    ? t('topbar.roleOwner', 'Super Administrateur')
                    : user?.role === 'ADMIN'
                      ? t('topbar.roleAdmin', 'Administrateur')
                      : t('topbar.roleUser', 'Utilisateur')}
                </motion.span>
                <AnimatePresence>
                  {!isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-brand font-bold uppercase tracking-widest whitespace-nowrap"
                    >
                      {t('topbar.online', 'En Ligne')}
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

                  <button
                    onClick={() => setIsSwitcherOpen(true)}
                    className="p-2 text-text-muted hover:text-text-main bg-elevated/50 hover:bg-elevated rounded-full transition-all duration-200 shadow-inner border border-white/5"
                    title={t('topbar.switchCompany', "Changer d'entreprise")}
                  >
                    <Building className="h-4 w-4 text-brand" />
                  </button>

                  <div className="flex items-center text-text-muted hover:text-text-main transition-colors bg-elevated/50 rounded-full px-3 py-2 shadow-inner border border-white/5">
                    <Globe className="h-4 w-4 mr-1.5 text-brand" />
                    <select
                      onChange={changeLanguage}
                      value={i18n.language}
                      className="bg-transparent border-none text-[11px] font-bold text-text-main focus:ring-0 cursor-pointer outline-none appearance-none"
                    >
                      <option className="bg-surface text-text-main" value="fr">FR</option>
                      <option className="bg-surface text-text-main" value="en">EN</option>
                      <option className="bg-surface text-text-main" value="ar">AR</option>
                    </select>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="p-2 text-text-muted hover:text-text-main bg-elevated/50 hover:bg-elevated rounded-full transition-all duration-200 shadow-inner border border-white/5 ml-1"
                    title={theme === 'dark' ? t('topbar.lightMode', 'Mode Clair') : t('topbar.darkMode', 'Mode Sombre')}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-amber-500 animate-[spin_20s_linear_infinite]" />
                    ) : (
                      <Moon className="h-4 w-4 text-indigo-500" />
                    )}
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
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-0.5">{t('topbar.activeSession', 'Session Active')}</p>
                    <p className="text-xs text-text-main font-semibold">{user?.email}</p>
                  </div>
                  <div className="px-2.5 py-1.5 bg-brand/10 border border-brand/20 text-brand text-[10px] uppercase font-bold rounded-lg shadow-sm">
                    {t('topbar.secureSpace', 'Espace Sécurisé')}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <CompanySwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </>
  );
};