import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Indispensable si votre backend utilise des cookies HTTP-Only pour le Refresh Token
  withCredentials: true, 
});

// 1. Intercepteur de REQUÊTE : Injecte le token d'accès s'il existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Intercepteur de RÉPONSE : Gère l'expiration du token (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 (Non autorisé), que ce n'est pas déjà une tentative de retry, et que ce n'est pas la route de login
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;

      try {
        // Appel à la route de rafraîchissement de NestJS
        // Note : axios classique est utilisé ici pour éviter une boucle infinie avec l'instance 'api'
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        // Mise à jour du token dans le stockage et dans l'état sans écraser les flags métier
        localStorage.setItem('access_token', access_token);
        const authState = useAuthStore.getState();
        if (authState.user) {
          authState.setAuth(
            authState.user,
            access_token,
            authState.onboardingComplete,
            authState.hasFinancialData,
          );
        }

        // Mise à jour du header de la requête originelle et relance
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Si le rafraîchissement échoue (Refresh token expiré), on force la déconnexion
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;