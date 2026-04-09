import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const THEMES = [
  { value: 'light' as const, icon: Sun, labelKey: 'settings.preferences.lightTheme' },
  { value: 'dark' as const, icon: Moon, labelKey: 'settings.preferences.darkTheme' },
  { value: 'system' as const, icon: Monitor, labelKey: 'settings.preferences.systemTheme' },
];

export const PreferencesCard = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  const handleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="card space-y-8">
      <h2 className="section-heading">{t('settings.preferences.heading')}</h2>

      {/* Language */}
      <div className="space-y-3">
        <label className="form-label">{t('settings.preferences.language')}</label>
        <div className="flex gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguage(lang.code)}
              className={`toggle-btn ${i18n.language === lang.code ? 'active' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <label className="form-label">{t('settings.preferences.theme')}</label>
        <div className="flex gap-3">
          {THEMES.map(({ value, icon: Icon, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`toggle-btn ${theme === value ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
