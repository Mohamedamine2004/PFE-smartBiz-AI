import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import bg3dDark from '../assets/login_bg_3d_1779374989314.png';
import bg3dLight from '../assets/login_bg_light_1779375227272.png';

export const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isRegister = location.pathname === '/register';

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#080D16] flex items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-500">
      
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

      {/* 3. Full-Screen Interactive SVG Financial Curves (Passing behind card) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none opacity-30 dark:opacity-20">
        <svg viewBox="0 0 1440 900" className="absolute w-full h-full">
          <defs>
            <linearGradient id="financialCurve" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
              <stop offset="30%" stopColor="#00D1FF" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M -100 520 Q 350 280 720 460 T 1540 220"
            fill="none"
            stroke="url(#financialCurve)"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M -100 540 Q 370 300 740 430 T 1540 240"
            fill="none"
            stroke="rgba(0,209,255,0.08)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: -1 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </div>

      {/* 4. Tech Grids & Fine Grain textures */}
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

      {/* 5. Floating Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-md cursor-pointer"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
      </button>

      {/* 6. Center Glassmorphic Card Container */}
      <div className={`w-full relative z-10 transition-all duration-500
        ${isRegister ? 'max-w-[530px]' : 'max-w-[450px]'}
        [&_.card]:!backdrop-blur-3xl [&_.card]:!transition-all [&_.card]:!duration-500
        [&_.card]:!bg-white/70 [&_.card]:!border [&_.card]:!border-slate-200/80
        [&_.card]:!shadow-[0_40px_80px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.7)]
        dark:[&_.card]:!bg-[#0a0f1d]/70 dark:[&_.card]:!border-white/10
        dark:[&_.card]:!shadow-[0_40px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]
        [&_.card]:!rounded-3xl [&_.card]:!p-8 md:[&_.card]:!p-10`}
      >
        <Outlet />
      </div>

      {/* 7. Footer Signals (Subtle branding) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-text-muted/60 flex items-center gap-1.5 opacity-60">
        <span>Made in Tunisia</span>
        <span className="text-[14px]">🇹🇳</span>
      </div>

    </div>
  );
};