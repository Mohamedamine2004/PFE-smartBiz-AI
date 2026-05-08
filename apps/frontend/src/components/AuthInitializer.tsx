import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { Spinner } from './ui';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
};

const isExpiredOrInvalidToken = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
};

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setIsInitializing(false);
        return;
      }

      if (isExpiredOrInvalidToken(token)) {
        localStorage.removeItem('access_token');
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          onboardingComplete: true,
          hasFinancialData: false,
        });
        setIsInitializing(false);
        return;
      }

      try {
        await useAuthStore.getState().fetchUser();
      } catch {
        localStorage.removeItem('access_token');
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          onboardingComplete: true,
          hasFinancialData: false,
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [setAuth]);

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