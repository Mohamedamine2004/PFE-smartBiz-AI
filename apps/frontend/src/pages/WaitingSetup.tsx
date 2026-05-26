import { useTranslation } from 'react-i18next';
import { Clock, RefreshCw, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Button } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

import bg3dDark from '../assets/login_bg_3d_1779374989314.png';
import bg3dLight from '../assets/login_bg_light_1779375227272.png';

export const WaitingSetup = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#080D16] flex items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-500 font-sans">
      
      {/* 1. 3D Animated Background Image (Light/Dark Dynamic Blend) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? 'dark-bg' : 'light-bg'}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: isDark ? 0.35 : 0.45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${isDark ? bg3dDark : bg3dLight})`,
              mixBlendMode: isDark ? 'screen' : 'normal',
            }}
          />
        </AnimatePresence>

        {/* Slow drift overlay to simulate 3D parallax */}
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
            x: [0, 10, -10, 0],
            y: [0, -10, 10, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
        />
      </div>

      {/* 2. Floating Neon Gradient Orbs (Mesh Effect) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Top-Left Cyan Orb */}
        <motion.div
          animate={{ 
            scale: [1, 1.15, 0.9, 1.1, 1],
            x: [0, 50, -30, 40, 0],
            y: [0, -40, 30, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[110px] opacity-30 dark:opacity-[0.16]"
          style={{ background: 'radial-gradient(circle, #00D1FF 0%, rgba(0,209,255,0.05) 70%)' }}
        />
        {/* Bottom-Right Indigo Orb */}
        <motion.div
          animate={{ 
            scale: [1, 0.85, 1.1, 0.9, 1],
            x: [0, -60, 40, -30, 0],
            y: [0, 50, -40, 30, 0],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full blur-[120px] opacity-25 dark:opacity-[0.14]"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, rgba(99,102,241,0.05) 70%)' }}
        />
        {/* Center Emerald Orb */}
        <motion.div
          animate={{ 
            scale: [0.9, 1.1, 0.95, 0.85, 0.9],
            x: [30, -20, 40, -30, 30],
            y: [-20, 30, -30, 40, -20],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[25%] left-[30%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 dark:opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #10B981 0%, rgba(16,185,129,0.05) 70%)' }}
        />
      </div>

      {/* 3. Tech Grids & Fine Grain textures */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] z-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.012] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. Floating Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-md cursor-pointer"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
      </button>

      {/* 5. Center Glassmorphic Card Container */}
      <div className="w-full max-w-[450px] relative z-10 transition-all duration-500
        bg-white/70 dark:bg-[#0a0f1d]/70 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10
        shadow-[0_40px_80px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.7)]
        dark:shadow-[0_40px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]
        rounded-3xl p-8 md:p-10 text-center space-y-6"
      >
        {/* Icon with orbital pulse animation */}
        <div className="relative mx-auto w-18 h-18 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.15, 1], rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-brand/40"
          />
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-lg text-brand">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'var(--font-display)' }}>
            {t('waitingSetup.title')}
          </h1>
          <p className="text-sm text-text-muted leading-relaxed font-medium">
            {t('waitingSetup.description')}
          </p>
        </div>

        {/* User info badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface/80 dark:bg-white/5 rounded-xl border border-border/80 text-xs font-semibold text-text-muted">
          <span>{user?.firstName} {user?.lastName}</span>
          <span className="px-2 py-0.5 bg-brand/10 text-brand rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse">
            {user?.role}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleRefresh} fullWidth icon={<RefreshCw className="w-4 h-4" />}>
            {t('waitingSetup.refresh')}
          </Button>
          <Button variant="danger" onClick={logout} fullWidth icon={<LogOut className="w-4 h-4" />}>
            {t('topbar.logout')}
          </Button>
        </div>
      </div>

      {/* 6. Footer Signals (Subtle branding) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-text-muted/60 flex items-center gap-1.5 opacity-60 pointer-events-none select-none font-medium">
        <span>Made in Tunisia</span>
        <span className="text-[14px]">🇹🇳</span>
      </div>

    </div>
  );
};
