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
  avatarUrl?: string; // Ajout du support de l'avatar
}

export interface CompanyMembership {
  companyId: string;
  companyName: string;
  registrationNumber: string;
  sector?: string;
  country?: string;
  role: 'OWNER' | 'ADMIN' | 'COLLAB' | 'READER';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  onboardingComplete: boolean;
  hasFinancialData: boolean;
  myCompanies: CompanyMembership[];
  
  // Actions
  login: (email: string, password: string) => Promise<{ redirect: string }>;
  logout: () => void;
  setAuth: (user: User, token: string, onboardingComplete?: boolean, hasFinancialData?: boolean) => void;
  setCompanyStatus: (onboardingComplete: boolean, hasFinancialData: boolean) => void;
  setHasFinancialData: (hasData: boolean) => void;
  fetchUser: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => void; // Nouvelle action pour mettre à jour l'avatar
  fetchMyCompanies: () => Promise<void>;
  switchCompany: (companyId: string, passwordString: string) => Promise<void>;
}

// Fonction d'enrichissement de l'utilisateur avec l'avatar persistant localement
const enrichUserWithAvatar = (u: User | null): User | null => {
  if (!u) {
    const defaultAvatar = localStorage.getItem('smartbiz_user_avatar_default');
    if (defaultAvatar) {
      return { id: 'default', firstName: 'Utilisateur', lastName: '', email: '', role: 'READER', companyId: '', avatarUrl: defaultAvatar } as User;
    }
    return null;
  }
  const localAvatar = localStorage.getItem(`smartbiz_user_avatar_${u.id}`) || localStorage.getItem('smartbiz_user_avatar_default');
  return { ...u, avatarUrl: localAvatar || undefined };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token'),
  onboardingComplete: true,
  hasFinancialData: false,
  myCompanies: [],

  setHasFinancialData: (hasData) => set({ hasFinancialData: hasData }),

  setAuth: (user, token, onboardingComplete = true, hasFinancialData = false) => {
    localStorage.setItem('access_token', token);
    set({ 
      user: enrichUserWithAvatar(user), 
      token, 
      isAuthenticated: true, 
      onboardingComplete, 
      hasFinancialData 
    });
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
        user: enrichUserWithAvatar(user),
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
        user: enrichUserWithAvatar(userData),
        token: token,
        isAuthenticated: true,
        onboardingComplete: onboardingComplete ?? true,
        hasFinancialData: hasFinancialData ?? false,
      });
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  },

  updateAvatar: (avatarUrl: string) => {
    const currentUser = get().user;
    const userId = currentUser?.id || 'default';
    localStorage.setItem(`smartbiz_user_avatar_${userId}`, avatarUrl);
    localStorage.setItem('smartbiz_user_avatar_default', avatarUrl); // Fallback universel
    if (currentUser) {
      set({
        user: { ...currentUser, avatarUrl }
      });
    } else {
      set({
        user: { id: 'default', firstName: 'Utilisateur', lastName: '', email: '', role: 'READER', companyId: '', avatarUrl } as User
      });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false, onboardingComplete: true, hasFinancialData: false, myCompanies: [] });
    
    // Optionnel : Forcer le rechargement pour vider complètement le cache de l'app
    window.location.href = '/login';
  },

  fetchMyCompanies: async () => {
    try {
      const response = await api.get('/auth/my-companies');
      set({ myCompanies: response.data });
    } catch (error) {
      console.error('Failed to fetch my companies', error);
    }
  },

  switchCompany: async (companyId: string, passwordString: string) => {
    try {
      const response = await api.post('/auth/switch-company', {
        companyId,
        password: passwordString,
      });

      const { access_token, user, redirect, onboardingComplete, hasFinancialData } = response.data;

      // Update tokens in local storage and memory
      localStorage.setItem('access_token', access_token);
      set({
        user: enrichUserWithAvatar(user),
        token: access_token,
        isAuthenticated: true,
        onboardingComplete: onboardingComplete ?? true,
        hasFinancialData: hasFinancialData ?? false,
      });

      // Fetch the updated list of companies to refresh roles/names
      await get().fetchMyCompanies();
      
      // Redirect or reload page to load new company context data
      window.location.reload();
    } catch (error) {
      throw error;
    }
  },
}));