import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { Spinner } from './ui';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user || response.data;
        const { onboardingComplete, hasFinancialData } = response.data;
        setAuth(userData, token, onboardingComplete ?? true, hasFinancialData ?? false);
      } catch {
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [setAuth, logout]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="text-brand" size={32} />
          <p className="text-sm font-medium text-text-muted tracking-wide animate-pulse">
            {t('app.loading')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};