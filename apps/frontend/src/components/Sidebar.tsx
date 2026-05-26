import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Settings, Calculator, FileText, ChevronRight, Zap } from 'lucide-react';
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
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

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
        { name: t('dashboard.tabs.strategic', 'Vue Stratégique'), href: '/dashboard?tab=strategic' },
        { name: t('dashboard.tabs.financial', 'Perf. Financière'), href: '/dashboard?tab=financial' },
        { name: t('dashboard.tabs.operational', 'Vue Opérationnelle'), href: '/dashboard?tab=operational' },
        { name: t('dashboard.tabs.mlProjection', 'Prédictions IA'), href: '/dashboard?tab=ml-projection' },
      ]
    },
    ...(isAdmin ? [{
      name: t('sidebar.team'),
      href: '/team',
      icon: Users,
      subItems: [
        { name: t('team.tabs.members', 'Membres'), href: '/team?tab=members' },
        { name: t('team.tabs.inbox', 'Boîte de réception'), href: '/team?tab=inbox' },
      ]
    }] : []),
    {
      name: t('sidebar.valuation'),
      href: '/valuation',
      icon: Calculator,
      subItems: [
        { name: t('valuation.methods.evEbitda', 'EV / EBITDA'), href: '/valuation?method=EV_EBITDA' },
        { name: t('valuation.methods.evRevenue', 'EV / Revenue'), href: '/valuation?method=EV_REVENUE' },
        { name: t('valuation.methods.peRatio', 'P/E Ratio'), href: '/valuation?method=PE_RATIO' },
        { name: t('valuation.methods.assetBased', 'Asset-Based'), href: '/valuation?method=ASSET_BASED' },
        { name: t('valuation.methods.gordonGrowth', 'Gordon Growth'), href: '/valuation?method=GORDON_GROWTH' },
      ]
    },
    {
      name: t('sidebar.reports', 'Reports'),
      href: '/reports',
      icon: FileText,
      subItems: [
        { name: t('reports.tabs.newReport', 'Nouveau Rapport'), href: '/reports?tab=wizard' },
        { name: t('reports.tabs.myReports', 'Mes Rapports'), href: '/reports?tab=library' },
      ]
    },
    {
      name: t('sidebar.settings'),
      href: '/settings',
      icon: Settings,
      subItems: [
        { name: t('settings.tabs.company', 'Entreprise'), href: '/settings?tab=company' },
        { name: t('settings.tabs.account', 'Mon compte'), href: '/settings?tab=account' },
      ]
    },
  ];

  return (
    <aside
      className={`
        fixed z-40 h-full lg:h-[calc(100vh-32px)] top-0 lg:top-4 ltr:left-0 rtl:right-0 ltr:lg:left-4 rtl:lg:right-4
        flex flex-col transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        bg-surface/80 backdrop-blur-2xl lg:border border-white/10 dark:border-white/5
        lg:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]
        translate-x-0
        ${isOpen ? 'w-[260px]' : 'w-[88px]'}
      `}
    >
      {/* Top inner shimmer line */}
      <div
        className="absolute top-0 ltr:left-4 rtl:right-4 ltr:right-4 rtl:left-4 h-px pointer-events-none rounded-full z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
      />

      {/* Brand glow orb — top corner */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="brand-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-0 ltr:right-0 rtl:left-0 w-40 h-40 pointer-events-none rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,209,255,0.07) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
        )}
      </AnimatePresence>
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
      <div className="flex h-24 w-full items-center justify-center px-4 mb-2 relative shrink-0">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center justify-center w-full h-full relative group">
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <div className="absolute inset-0 bg-brand blur-2xl opacity-10 group-hover:opacity-30 transition-opacity rounded-[32px]"></div>
            <Logo 
              className={`relative z-10 drop-shadow-md object-contain transition-all duration-500 ease-out fill-current ${isOpen ? 'w-full max-h-16' : 'w-9 max-h-9'}`} 
              minimized={!isOpen}
            />
          </div>
        </Link>

        {/* Floating Toggle Button on the Edge */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex absolute ltr:-right-3.5 rtl:-left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 bg-surface/90 backdrop-blur border border-border/80 rounded-full items-center justify-center text-text-muted hover:text-brand hover:border-brand/50 hover:bg-brand/10 shadow-lg shadow-black/5 transition-all z-50 focus:outline-none"
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-500 ${isOpen ? (document.documentElement.dir === 'rtl' ? 'rotate-180' : 'rotate-180') : (document.documentElement.dir === 'rtl' ? 'rotate-180' : '')}`} />
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
            <div key={item.href} className="flex flex-col relative">
              <Link
                to={item.href}
                title={isOpen ? "" : item.name}
                onMouseEnter={() => !isOpen && setHoveredIndex(item.href)}
                onMouseLeave={() => setHoveredIndex(null)}
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
                className={`relative flex items-center px-4 py-3 rounded-2xl group transition-all duration-300 z-10 cursor-pointer ${isOpen ? '' : 'justify-center px-0'}`}
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

                {/* Glowing icon container */}
                <div
                  className={`relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${isMainActive ? '' : 'group-hover:scale-105'}`}
                  style={isMainActive ? {
                    background: 'rgba(0,209,255,0.09)',
                    boxShadow: '0 0 14px rgba(0,209,255,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                  } : {}}
                >
                  <Icon
                    className={`h-5 w-5 relative z-10 transition-all duration-300 ease-out ${
                      isMainActive
                        ? 'text-brand'
                        : 'text-text-muted group-hover:text-text-main'
                    }`}
                    style={isMainActive ? { filter: 'drop-shadow(0 0 6px rgba(0,209,255,0.6))' } : {}}
                  />
                </div>

                {isOpen && (
                  <span className={`ml-3.5 text-[14px] font-semibold tracking-wide relative z-10 transition-all duration-300 ${isMainActive ? 'text-text-main drop-shadow-sm' : 'text-text-muted group-hover:text-text-main'
                    }`}>
                    {item.name}
                  </span>
                )}

                {/* Glowing active dot fallback */}
                {isMainActive && isOpen && !hasSubItems && (
                  <div className="absolute ltr:right-4 rtl:left-4 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(0,158,135,1)]" />
                )}

                {/* Accordion Arrow for subItems */}
                {hasSubItems && isOpen && (
                  <ChevronRight className={`absolute ltr:right-4 rtl:left-4 h-4 w-4 text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-90 text-brand' : 'rtl:rotate-180'}`} />
                )}

                {/* Floating Glassmorphic Tooltip Badge on Collapsed hover */}
                <AnimatePresence>
                  {!isOpen && hoveredIndex === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute ltr:left-[96px] rtl:right-[96px] py-2 px-3 bg-[#0a0f1d]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-[9999] pointer-events-none whitespace-nowrap"
                    >
                      <span className="text-xs font-bold text-text-main font-sans tracking-wide">
                        {item.name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>

              {/* Dynamic Sub-Items Container */}
              <AnimatePresence>
                {showSubItems && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="ml-[26px] mt-2 mb-1 flex flex-col space-y-1 pl-4 relative overflow-hidden"
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
                        isSubActive = subItem.name.includes('Nouvelle') || subItem.name.includes('Général') || subItem.name.includes('Générateur'); 
                      }

                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          onClick={onNavigate}
                          className={`relative py-2 ltr:pl-3 ltr:pr-2 rtl:pr-3 rtl:pl-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center group z-10 ${isSubActive ? 'text-brand bg-brand/5' : 'text-text-muted hover:text-text-main hover:bg-elevated/50'
                            }`}
                        >
                          {isSubActive && <div className="absolute ltr:left-[-16px] rtl:right-[-16px] w-[2px] h-[60%] bg-brand rounded-full shadow-[0_0_8px_rgba(0,158,135,1)]" />}
                          <span className={`transition-transform duration-300 ${isSubActive ? 'ltr:translate-x-1 rtl:-translate-x-1' : 'ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1'}`}>
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

      {/* Bottom Area: User Profile & AI Status Card */}
      <div className="px-3 pb-4 pt-1 shrink-0 mt-auto flex flex-col items-center justify-center relative z-20">
        {/* Divider */}
        <div
          className="mb-4 h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--border-color), transparent)' }}
        />

        {isOpen ? (
          <Link to="/settings" onClick={onNavigate} className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl p-3 border group cursor-pointer block"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Corner glow */}
              <div
                className="absolute -bottom-4 ltr:-right-4 rtl:-left-4 w-16 h-16 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.2) 0%, transparent 70%)', filter: 'blur(10px)' }}
              />

              <div className="relative z-10 flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-surface border border-border group-hover:border-brand/30 transition-colors duration-300">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-text-main">
                      {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                    </span>
                  )}
                  
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
                    <div className="absolute w-full h-full rounded-full bg-brand animate-ping opacity-75" />
                    <div className="absolute w-full h-full rounded-full bg-brand border border-background shadow-[0_0_8px_rgba(0,209,255,0.8)]" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="text-sm font-bold text-text-main truncate group-hover:text-brand transition-colors duration-200">
                    {user?.firstName || 'User'} {user?.lastName || ''}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-brand shrink-0" />
                    <span className="text-[10px] font-semibold text-text-muted truncate">
                      {user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : 'Member'} • AI Active
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ) : (
          <Link 
            to="/settings" 
            onClick={onNavigate} 
            title={t('sidebar.settings')}
            className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden bg-elevated border border-border hover:border-brand/40 shadow-lg cursor-pointer group transition-all duration-300"
          >
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
            ) : (
              <span className="text-sm font-bold text-text-main relative z-10">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </span>
            )}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 z-20">
              <div className="absolute w-full h-full rounded-full bg-brand animate-ping opacity-75" />
              <div className="absolute w-full h-full rounded-full bg-brand border border-background shadow-[0_0_8px_rgba(0,209,255,0.8)]" />
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
};