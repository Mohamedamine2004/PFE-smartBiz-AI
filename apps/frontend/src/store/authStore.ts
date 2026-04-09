import { create } from 'zustand';
import api from '../lib/axios';

// Interfaces basées sur votre schéma Prisma backend
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'READER';
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
}

export const useAuthStore = create<AuthState>((set) => ({
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

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false, onboardingComplete: true, hasFinancialData: false });
    
    // Optionnel : Forcer le rechargement pour vider complètement le cache de l'app
    window.location.href = '/login';
  },
}));