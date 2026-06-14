import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHelpModal } from '../components/ui/ShortcutsHelpModal';

import bg3dDark from '../assets/login_bg_3d_1779374989314.png';
import bg3dLight from '../assets/login_bg_light_1779375227272.png';

export const PrivateLayout = () => {
  const { isAuthenticated, onboardingComplete, user } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    // Dynamic theme synchronization
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Protection de la route
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Forcer l'onboarding si le profil est incomplet
  if (!onboardingComplete) {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

    // L'ADMIN peut accéder à /settings pour terminer la configuration
    if (isAdmin && location.pathname !== '/settings') {
      return <Navigate to="/settings" replace />;
    }

    // Les USER/READER ne peuvent pas configurer : page d'attente
    if (!isAdmin && location.pathname !== '/waiting-setup') {
      return <Navigate to="/waiting-setup" replace />;
    }
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background selection:bg-brand/30 selection:text-brand font-sans">
      {/* Floating Glassmorphic Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div
        className={`flex flex-col w-full min-h-screen transition-[padding-left,padding-right] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarOpen
          ? 'ltr:pl-[88px] ltr:lg:pl-[292px] rtl:pr-[88px] rtl:lg:pr-[292px]'
          : 'ltr:pl-[88px] ltr:lg:pl-[112px] rtl:pr-[88px] rtl:lg:pr-[112px]'
          }`}
      >
        {/* Dynamic Island Topbar */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Zone Principale */}
        <main className="flex-1 w-full pt-4 lg:pt-28 pb-12 px-4 sm:px-8 relative z-0 overflow-y-auto scroll-smooth">
          {/* Subtle Ambient Studio Lights */}
          <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand/5 blur-[120px] pointer-events-none -z-10 animate-drift-one" />
          <div className="fixed bottom-[-20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none -z-10 animate-drift-two" />

          {/* 3D Dashboard Background Image (Extremely subtle blend for private dashboard pages) */}
          <div className="fixed inset-0 z-[-15] pointer-events-none overflow-hidden select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={isDark ? 'dark-bg' : 'light-bg'}
                initial={{ opacity: 0 }}
                animate={{ opacity: isDark ? 0.16 : 0.12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${isDark ? bg3dDark : bg3dLight})`,
                  mixBlendMode: isDark ? 'screen' : 'normal',
                }}
              />
            </AnimatePresence>

            {/* Slow drifting scale parallax overlay */}
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                x: [0, 6, -6, 0],
                y: [0, -6, 6, 0],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 opacity-40"
            />
          </div>

          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal open={showHelp} onClose={() => setShowHelp(false)} shortcuts={shortcuts} />
    </div>
  );
};