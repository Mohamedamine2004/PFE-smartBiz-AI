import { create } from 'zustand';
import api from '../lib/axios';

// Interfaces basées sur votre schéma Prisma backend
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'COLLAB' | 'READER';
  companyId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  onboardingComplete: boolean;
  hasFinancialData: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ redirect: string }>;
  logout: () => void;
  setAuth: (user: User, token: string, onboardingComplete?: boolean, hasFinancialData?: boolean) => void;
  setCompanyStatus: (onboardingComplete: boolean, hasFinancialData: boolean) => void;
  setHasFinancialData: (hasData: boolean) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token'),
  onboardingComplete: true,
  hasFinancialData: false,

  setHasFinancialData: (hasData) => set({ hasFinancialData: hasData }),

  setAuth: (user, token, onboardingComplete = true, hasFinancialData = false) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true, onboardingComplete, hasFinancialData });
  },

  setCompanyStatus: (onboardingComplete, hasFinancialData) => {
    set({ onboardingComplete, hasFinancialData });
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { access_token, user, redirect, onboardingComplete, hasFinancialData } = response.data;
      
      // Persistance du jeton et mise à jour de l'état
      localStorage.setItem('access_token', access_token);
      set({
        user,
        token: access_token,
        isAuthenticated: true,
        onboardingComplete: onboardingComplete ?? true,
        hasFinancialData: hasFinancialData ?? false,
      });

      return { redirect: redirect || '/dashboard' };
    } catch (error) {
      // Propagation de l'erreur pour que le composant Login.tsx puisse l'afficher
      throw error;
    }
  },

  fetchUser: async () => {
    try {
      let token = get().token || localStorage.getItem('access_token');
      
      try {
        // Force a token refresh to ensure the JWT payload has the latest role
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data && refreshRes.data.access_token) {
          token = refreshRes.data.access_token;
          localStorage.setItem('access_token', token as string);
        }
      } catch (e) {
        console.warn('Silent token refresh failed', e);
      }
      
      if (!token) return;
      
      const response = await api.get('/auth/me', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        params: { t: Date.now() }
      });
      const userData = response.data.user || response.data;
      const { onboardingComplete, hasFinancialData } = response.data;
      
      set({
        user: userData,
        token: token,
        isAuthenticated: true,
        onboardingComplete: onboardingComplete ?? true,
        hasFinancialData: hasFinancialData ?? false,
      });
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false, onboardingComplete: true, hasFinancialData: false });
    
    // Optionnel : Forcer le rechargement pour vider complètement le cache de l'app
    window.location.href = '/login';
  },
}));