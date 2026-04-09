import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { LogOut, UserCircle, Moon, Sun, Globe } from 'lucide-react';
import logod from '../assets/logod.svg';
import logol from '../assets/logol.svg';

export const Topbar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="flex h-[58px] items-center justify-between border-b border-border bg-surface px-6 flex-shrink-0 z-10 transition-colors duration-300">
      <div className="flex items-center">
        <img src={logol} alt="SmartBiz AI" className="h-12 w-auto dark:hidden" />
        <img src={logod} alt="SmartBiz AI" className="h-12 w-auto hidden dark:block" />
      </div>

      <div className="flex items-center space-x-4 space-x-reverse">
        
        {/* Sélecteur de Langue */}

        <div className="flex items-center text-text-muted">
          <Globe className="h-4 w-4 mx-2" />
          <select
            onChange={changeLanguage}
            value={i18n.language}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-text-main"
          >
            <option value="fr" className="bg-surface text-text-main">FR</option>
            <option value="en" className="bg-surface text-text-main">EN</option>
            <option value="ar" className="bg-surface text-text-main">العربية</option>
          </select>
        </div>

        {/* Bouton Thème */}

        {/* Bouton Thème */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-[8px] transition-colors"
          aria-label="Basculer le thème"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-border mx-2" aria-hidden="true" />

        {/* Informations Utilisateur */}
        <div className="flex items-center">
          <UserCircle className="h-7 w-7 text-text-muted" />
          <div className="mx-3 hidden md:block">
            <p className="text-sm font-medium text-text-main leading-none">{user?.email}</p>
            <p className="text-[11px] font-semibold text-text-muted mt-1 text-code tracking-wider uppercase">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="flex items-center rounded-[8px] px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 transition-colors mx-2"
        >
          <LogOut className="mx-2 h-4 w-4" />
          {t('topbar.logout')}
        </button>
      </div>
    </header>
  );
};