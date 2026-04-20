import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const isLocizeBanner = (args: unknown[]) =>
  args
    .map((arg) => String(arg))
    .join(' ')
    .toLowerCase()
    .includes('locize.com');

const i18nLogger = {
  type: 'logger' as const,
  log: (...args: unknown[]) => {
    if (isLocizeBanner(args)) {
      return;
    }
    console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isLocizeBanner(args)) {
      return;
    }
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isLocizeBanner(args)) {
      return;
    }
    console.error(...args);
  },
};

i18n
  .use(i18nLogger)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: {
      fr: ['fr', 'en'],
      ar: ['ar', 'en'],
      en: ['en'],
      default: ['fr', 'en'],
    },
    supportedLngs: ['fr', 'en', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: false,
    returnNull: false,
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;