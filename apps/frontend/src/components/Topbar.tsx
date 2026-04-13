import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { LogOut, UserCircle, Moon, Sun, Globe, Menu } from 'lucide-react';
import logod from '../assets/logod.svg';
import logol from '../assets/logol.svg';

interface TopbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Topbar = ({ onToggleSidebar, sidebarOpen }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="flex h-[58px] items-center justify-between border-b border-border bg-surface px-4 lg:px-6 flex-shrink-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <img src={logol} alt="SmartBiz AI" className="h-10 lg:h-12 w-auto dark:hidden" />
        <img src={logod} alt="SmartBiz AI" className="h-10 lg:h-12 w-auto hidden dark:block" />
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Language Selector - hidden on mobile */}
        <div className="hidden sm:flex items-center text-text-muted">
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

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-[8px] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Basculer le thème"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <div className="h-5 w-px bg-border mx-1 lg:mx-2" aria-hidden="true" />

        {/* User Info */}
        <div className="flex items-center">
          <UserCircle className="h-6 w-6 lg:h-7 lg:w-7 text-text-muted" />
          <div className="mx-2 lg:mx-3 hidden md:block">
            <p className="text-sm font-medium text-text-main leading-none">{user?.email}</p>
            <p className="text-[11px] font-semibold text-text-muted mt-1 text-code tracking-wider uppercase">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout - Icon only on mobile */}
        <button
          onClick={logout}
          className="flex items-center rounded-[8px] px-2 lg:px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors min-h-[44px]"
        >
          <LogOut className="h-5 w-5 lg:hidden" />
          <span className="hidden lg:inline">{t('topbar.logout')}</span>
        </button>
      </div>
    </header>
  );
};