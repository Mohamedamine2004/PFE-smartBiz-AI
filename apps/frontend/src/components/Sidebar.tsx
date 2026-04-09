import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Settings, Calculator, PanelLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  onNavigate?: () => void;
}

export const Sidebar = ({ isOpen, onToggleSidebar, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ name: t('sidebar.team'), href: '/team', icon: Users }] : []),
    { name: t('sidebar.valuation'), href: '/valuation', icon: Calculator },
    { name: t('sidebar.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`
        relative z-20 flex h-full flex-col bg-surface border-r border-border transition-all duration-300
        ${isOpen ? 'w-[220px]' : 'w-[80px]'}
      `}
    >
      <div
        className={`flex h-[58px] items-center border-b border-border transition-colors duration-300 ${
          isOpen ? 'px-4' : 'justify-center px-2'
        }`}
      >
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-[8px] transition-colors"
          aria-label={isOpen ? 'Fermer la barre latérale' : 'Ouvrir la barre latérale'}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className={`flex-1 space-y-2 py-6 ${isOpen ? 'px-4' : 'px-2'}`}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              title={item.name}
              className={`group flex items-center rounded-[8px] py-2.5 text-sm font-medium transition-all duration-200 ${
                isOpen ? 'px-3' : 'justify-center px-2'
              } ${
                isActive
                  ? 'bg-elevated text-brand shadow-sm border border-border'
                  : 'text-text-muted hover:bg-elevated hover:text-text-main border border-transparent'
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-main'
                } ${isOpen ? 'mx-3' : 'mx-0'}`}
                aria-hidden="true"
              />
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};