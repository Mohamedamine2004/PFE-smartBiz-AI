import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Settings, Calculator, FileText, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Logo } from './ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    return {
      '/dashboard': location.pathname.startsWith('/dashboard'),
      '/team': location.pathname.startsWith('/team'),
      '/valuation': location.pathname.startsWith('/valuation'),
      '/reports': location.pathname.startsWith('/reports'),
      '/settings': location.pathname.startsWith('/settings'),
    };
  });

  useEffect(() => {
    const mainPath = '/' + location.pathname.split('/')[1];
    setExpandedMenus(prev => ({ ...prev, [mainPath]: true }));
  }, [location.pathname]);

  const navigation = [
    {
      name: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      subItems: [
        { name: 'Vue Stratégique', href: '/dashboard?tab=strategic' },
        { name: 'Perf. Financière', href: '/dashboard?tab=financial' },
        { name: 'Vue Opérationnelle', href: '/dashboard?tab=operational' },
        { name: 'Prédictions IA', href: '/dashboard?tab=ml-projection' },
      ]
    },
    ...(isAdmin ? [{
      name: t('sidebar.team'),
      href: '/team',
      icon: Users,
      subItems: [
        { name: 'Membres', href: '/team?tab=members' },
        { name: 'Boîte de réception', href: '/team?tab=inbox' },
      ]
    }] : []),
    {
      name: t('sidebar.valuation'),
      href: '/valuation',
      icon: Calculator,
      subItems: [
        { name: 'EV / EBITDA', href: '/valuation?method=EV_EBITDA' },
        { name: 'EV / Revenue', href: '/valuation?method=EV_REVENUE' },
        { name: 'P/E Ratio', href: '/valuation?method=PE_RATIO' },
        { name: 'Asset-Based', href: '/valuation?method=ASSET_BASED' },
        { name: 'Gordon Growth', href: '/valuation?method=GORDON_GROWTH' },
      ]
    },
    {
      name: t('sidebar.reports', 'Reports'),
      href: '/reports',
      icon: FileText,
      subItems: [
        { name: 'Nouveau Rapport', href: '/reports?tab=wizard' },
        { name: 'Mes Rapports', href: '/reports?tab=library' },
      ]
    },
    {
      name: t('sidebar.settings'),
      href: '/settings',
      icon: Settings,
      subItems: [
        { name: 'Entreprise', href: '/settings?tab=company' },
        { name: 'Mon compte', href: '/settings?tab=account' },
      ]
    },
  ];

  return (
    <aside
      className={`
        fixed z-40 h-full lg:h-[calc(100vh-32px)] top-0 lg:top-4 left-0 lg:left-4
        flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        bg-surface/80 backdrop-blur-2xl lg:border border-white/10 dark:border-white/5
        lg:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]
        ${isOpen ? 'w-[260px] translate-x-0' : 'w-[84px] -translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 left-0 bg-background/60 backdrop-blur-sm lg:hidden -z-10 w-[100vw] h-[100vh]"
            onClick={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Header */}
      <div className="flex h-32 w-full items-center justify-center px-4 mb-4 relative">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center justify-center w-full h-full relative group">
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <div className="absolute inset-0 bg-brand blur-2xl opacity-10 group-hover:opacity-30 transition-opacity rounded-[32px]"></div>
            <Logo className={`relative z-10 drop-shadow-md object-contain transition-all duration-500 ease-out fill-current ${isOpen ? 'w-full max-h-20' : 'w-12 max-h-12'}`} />
          </div>
        </Link>

        {/* Floating Toggle Button on the Edge */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 bg-surface/90 backdrop-blur border border-border/80 rounded-full items-center justify-center text-text-muted hover:text-brand hover:border-brand/50 hover:bg-brand/10 shadow-lg shadow-black/5 transition-all z-50 focus:outline-none"
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar relative">
        {navigation.map((item) => {
          const isMainActive = location.pathname.startsWith(item.href) && (item.href !== '/dashboard' || location.pathname === '/dashboard');
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;

          const isExpanded = expandedMenus[item.href] || false;
          const showSubItems = hasSubItems && isExpanded && isOpen;

          return (
            <div key={item.href} className="flex flex-col">
              <Link
                to={item.href}
                title={item.name}
                onClick={(e) => {
                  if (hasSubItems && isOpen) {
                    if (isMainActive) {
                      e.preventDefault();
                      setExpandedMenus(prev => ({ ...prev, [item.href]: !prev[item.href] }));
                    } else {
                      setExpandedMenus(prev => ({ ...prev, [item.href]: true }));
                    }
                  } else if (hasSubItems && !isOpen) {
                    e.preventDefault();
                    onToggleSidebar();
                    setExpandedMenus(prev => ({ ...prev, [item.href]: true }));
                  } else {
                    onNavigate?.();
                  }
                }}
                className="relative flex items-center px-4 py-3 rounded-2xl group transition-colors z-10 cursor-pointer"
              >
                {/* Magnetic Active Pill Background using Framer Motion */}
                {isMainActive && (
                  <motion.div
                    layoutId="activeSidebarTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-brand/15 to-brand/5 border border-brand/20 rounded-2xl -z-10 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Hover effect background */}
                {!isMainActive && (
                  <div className="absolute inset-0 bg-elevated/50 border border-transparent opacity-0 group-hover:opacity-100 rounded-2xl -z-10 transition-all duration-300 group-hover:border-white/5" />
                )}

                <Icon
                  className={`h-[22px] w-[22px] relative z-10 transition-all duration-300 ease-out ${isMainActive ? 'text-brand drop-shadow-[0_0_8px_rgba(0,158,135,0.5)]' : 'text-text-muted group-hover:text-text-main group-hover:scale-[1.15]'
                    }`}
                />

                {isOpen && (
                  <span className={`ml-3.5 text-[14px] font-semibold tracking-wide relative z-10 transition-all duration-300 ${isMainActive ? 'text-text-main drop-shadow-sm' : 'text-text-muted group-hover:text-text-main'
                    }`}>
                    {item.name}
                  </span>
                )}

                {/* Glowing active dot fallback */}
                {isMainActive && isOpen && !hasSubItems && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(0,158,135,1)]" />
                )}

                {/* Accordion Arrow for subItems */}
                {hasSubItems && isOpen && (
                  <ChevronRight className={`absolute right-4 h-4 w-4 text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-90 text-brand' : ''}`} />
                )}
              </Link>

              {/* Dynamic Sub-Items Container */}
              <AnimatePresence>
                {showSubItems && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="ml-[26px] mt-2 mb-1 flex flex-col space-y-1 pl-4 border-l-2 border-brand/20 relative overflow-hidden"
                  >
                    {item.subItems?.map((subItem) => {
                      let isSubActive = false;
                      const searchParams = new URLSearchParams(location.search);

                      // Match tabs for dashboard and team exactly
                      if (item.href === '/dashboard') {
                        const currentTab = searchParams.get('tab') || 'strategic';
                        const subTabMatch = subItem.href.match(/tab=([^&]*)/);
                        isSubActive = subTabMatch ? subTabMatch[1] === currentTab : false;
                      } else if (item.href === '/team') {
                        const currentTab = searchParams.get('tab') || 'members';
                        const subTabMatch = subItem.href.match(/tab=([^&]*)/);
                        isSubActive = subTabMatch ? subTabMatch[1] === currentTab : false;
                      } else if (item.href === '/valuation') {
                        const currentMethod = searchParams.get('method') || 'EV_EBITDA';
                        const subMethodMatch = subItem.href.match(/method=([^&]*)/);
                        isSubActive = subMethodMatch ? subMethodMatch[1] === currentMethod : false;
                      } else if (item.href === '/settings') {
                        const currentTab = searchParams.get('tab') || 'company';
                        const subTabMatch = subItem.href.match(/tab=([^&]*)/);
                        isSubActive = subTabMatch ? subTabMatch[1] === currentTab : false;
                      } else {
                        // Fallback matching for other pages where simulated sub-pages are added
                        isSubActive = subItem.name.includes('Nouvelle') || subItem.name.includes('Général') || subItem.name.includes('Générateur'); // naive hack to show one active
                      }

                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          onClick={onNavigate}
                          className={`relative py-2 pl-3 pr-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center group z-10 ${isSubActive ? 'text-brand bg-brand/5' : 'text-text-muted hover:text-text-main hover:bg-elevated/50'
                            }`}
                        >
                          {isSubActive && <div className="absolute left-[-16px] w-[2px] h-[60%] bg-brand rounded-full shadow-[0_0_8px_rgba(0,158,135,1)]" />}
                          <span className={`transition-transform duration-300 ${isSubActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                            {subItem.name}
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom Area: Server Status / App Info */}
      {isOpen && (
        <div className="p-4 mb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-elevated to-background p-4 border border-white/5 shadow-inner"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/20 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-4 h-4 bg-emerald-500/30 rounded-full animate-ping" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">État du Système</span>
                <span className="text-xs font-semibold text-text-main w-full truncate">Télémétrie OP</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </aside>
  );
};