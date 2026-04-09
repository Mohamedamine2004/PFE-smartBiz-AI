import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useAuthStore } from '../store/authStore';

export const PrivateLayout = () => {
  const { isAuthenticated, onboardingComplete, user } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="relative flex h-screen w-full bg-background overflow-hidden selection:bg-brand/30 selection:text-brand">
      {/* Barre Latérale (Fixe : 220px) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barre Supérieure (Fixe : 58px) */}
        <Topbar />

        {/* Zone Principale avec défilement indépendant */}
        <main className="flex-1 overflow-y-auto">
          {/* Conteneur de contenu strict : max 1080px, paddings spécifiques */}
          <div className="mx-auto w-full max-w-[1440px] px-6 pt-6 pb-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};