import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import * as Sentry from '@sentry/react';  // Temporarily disabled - package not installed in Docker
import App from './App.tsx';
import './index.css';
import './i18n/config.ts';
import i18n from './i18n/config.ts';

// Initialize Sentry SDK (disabled)
// Sentry.init({
//   dsn: import.meta.env.VITE_SENTRY_DSN,
//   environment: import.meta.env.MODE,
//   tracesSampleRate: import.meta.env.PROD ? 0.5 : 1.0,
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });

// Application du thème initial avant le rendu React
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

// Application de la direction initiale (RTL/LTR)
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);