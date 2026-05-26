import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

/* ------------------------------------------------------------------ */
/*  Language definitions                                               */
/* ------------------------------------------------------------------ */

const LANGUAGES = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷', subLabel: 'Mode latin LTR' },
  { code: 'en', label: 'English',   flag: '🇬🇧', subLabel: 'Latin LTR mode'  },
  { code: 'ar', label: 'العربية',  flag: '🇹🇳', subLabel: 'وضع RTL العربي'  },
];

/* ------------------------------------------------------------------ */
/*  Theme option type                                                  */
/* ------------------------------------------------------------------ */

type ThemeChoice = 'light' | 'dark';

const THEME_OPTIONS: {
  key: ThemeChoice;
  Icon: React.ElementType;
  labelKey: string;
  // mini dashboard shapes for visual preview
  bg: string;
  panelBg: string;
  barColor: string;
  accent: string;
  glow: string;
}[] = [
  {
    key: 'light',
    Icon: Sun,
    labelKey: 'settings.preferences.lightTheme',
    bg: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf8 100%)',
    panelBg: 'rgba(255,255,255,0.9)',
    barColor: '#6366f1',
    accent: '#00D1FF',
    glow: 'rgba(99,102,241,0.25)',
  },
  {
    key: 'dark',
    Icon: Moon,
    labelKey: 'settings.preferences.darkTheme',
    bg: 'linear-gradient(135deg, #0a0f1d 0%, #0c1220 100%)',
    panelBg: 'rgba(15,22,40,0.85)',
    barColor: '#00D1FF',
    accent: '#6366f1',
    glow: 'rgba(0,209,255,0.3)',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const PreferencesCard = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  const handleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-border/50 bg-surface/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] space-y-10">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <SlidersHorizontal className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">{t('settings.preferences.heading')}</h2>
          <p className="text-sm text-text-muted mt-0.5">Customize your interface experience and regional settings.</p>
        </div>
      </div>

      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ── Language Section ── */}
      <div className="relative z-10 space-y-4">
        <label className="text-sm font-semibold text-text-main block">{t('settings.preferences.language')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguage(lang.code)}
                className={`relative flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden group ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.12)]'
                    : 'bg-elevated/40 border-border/50 hover:bg-elevated/70 hover:border-border'
                }`}
              >
                {/* active glow overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none" />
                )}
                {/* flag circle */}
                <span
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-surface border border-border/50'
                  }`}
                >
                  {lang.flag}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isActive ? 'text-emerald-500' : 'text-text-main'}`}>
                    {lang.label}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">{lang.subLabel}</p>
                </div>
                {/* active ring */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ── Visual Theme Section ── */}
      <div className="relative z-10 space-y-4">
        <label className="text-sm font-semibold text-text-main block">{t('settings.preferences.theme')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                className={`relative p-5 rounded-2xl border text-left transition-all duration-400 overflow-hidden group ${
                  isActive
                    ? 'border-brand/50 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                    : 'border-border/50 hover:border-border hover:scale-[1.01]'
                }`}
                style={{ background: opt.bg }}
              >
                {/* Mini dashboard preview */}
                <div
                  className="w-full h-20 rounded-xl mb-4 relative overflow-hidden flex flex-col gap-1.5 p-2.5 border"
                  style={{
                    background: opt.panelBg,
                    borderColor: isActive ? opt.accent + '40' : 'rgba(150,150,150,0.1)',
                  }}
                >
                  {/* Fake topbar */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ background: opt.barColor, opacity: 0.8 }} />
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: opt.barColor, opacity: 0.15 }} />
                    <div className="w-4 h-4 rounded-md" style={{ background: opt.accent, opacity: 0.5 }} />
                  </div>
                  {/* Fake chart bars */}
                  <div className="flex items-end gap-1 mt-auto">
                    {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${h * 0.3}px`,
                          background: `linear-gradient(to top, ${opt.barColor}, ${opt.accent})`,
                          opacity: isActive ? 0.85 : 0.4,
                          boxShadow: isActive ? `0 0 6px ${opt.glow}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  {/* glow dot */}
                  {isActive && (
                    <div
                      className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-pulse"
                      style={{ background: opt.accent, boxShadow: `0 0 8px ${opt.glow}` }}
                    />
                  )}
                </div>

                {/* Label row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <opt.Icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: isActive ? opt.barColor : undefined }}
                    />
                    <span className={`text-sm font-bold ${isActive ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'}`}>
                      {t(opt.labelKey)}
                    </span>
                  </div>
                  {/* active dot */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? 'border-brand' : 'border-border'
                    }`}
                  >
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-brand shadow-[0_0_6px_rgba(0,209,255,0.5)]" />
                    )}
                  </div>
                </div>

                {/* active selection ring */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                    style={{ borderColor: opt.barColor + '60', boxShadow: `inset 0 0 30px ${opt.glow}` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* System option pill */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/40 bg-elevated/30 text-text-muted hover:text-text-main hover:border-border hover:bg-elevated/60 transition-all text-xs font-semibold"
        >
          <Monitor className="w-3.5 h-3.5" />
          {t('settings.preferences.systemTheme')}
        </button>
      </div>
    </div>
  );
};
