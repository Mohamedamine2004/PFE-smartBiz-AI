import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useAuthStore } from '../store/authStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHelpModal } from '../components/ui/ShortcutsHelpModal';

export const PrivateLayout = () => {
  const { isAuthenticated, onboardingComplete, user } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts();

  // Protection de la route
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Forcer l'onboarding si le profil est incomplet
  if (!onboardingComplete) {
    const isAdmin = user?.role === 'ADMIN';

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
    <div className="relative flex min-h-screen w-full bg-background overflow-hidden selection:bg-brand/30 selection:text-brand font-sans">
      {/* Floating Glassmorphic Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div 
        className={`flex flex-col w-full min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSidebarOpen ? 'lg:pl-[292px]' : 'lg:pl-[116px]'
        }`}
      >
        {/* Dynamic Island Topbar */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Zone Principale */}
        <main className="flex-1 w-full pt-4 lg:pt-28 pb-12 px-4 sm:px-8 relative z-0 overflow-y-auto scroll-smooth">
          {/* Subtle Ambient Studio Lights */}
          <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand/5 blur-[120px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none -z-10" />
          
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