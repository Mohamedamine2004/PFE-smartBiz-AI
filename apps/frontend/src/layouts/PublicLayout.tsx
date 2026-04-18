import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

export const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();

  // Si l'utilisateur est déjà connecté, il ne doit pas pouvoir voir le Login/Register
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-colors duration-300 overflow-hidden">
      
      {/* Topographic Animated Background Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 mt-[-30%] ml-[-30%] w-[160%] h-[160%] opacity-15 dark:opacity-20 flex items-center justify-center">
        <motion.div
           animate={{ rotate: 360, scale: [1, 1.05, 1] }}
           transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
           className="w-full h-full"
        >
          <svg className="w-full h-full text-brand" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <g stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8">
              {/* Financial/Topographic Contours */}
              <path d="M -200 400 C 200 600, 600 200, 1000 400" />
              <path d="M -200 450 C 250 650, 550 250, 1000 450" />
              <path d="M -200 500 C 300 700, 500 300, 1000 500" />
              <path d="M -200 550 C 350 750, 450 350, 1000 550" />
              <path d="M -200 600 C 400 800, 400 400, 1000 600" />
              <path d="M -200 350 C 150 550, 650 150, 1000 350" />
              <path d="M -200 300 C 100 500, 700 100, 1000 300" />

              {/* Data 'Epicenters' */}
              <circle cx="80%" cy="30%" r="50" />
              <circle cx="80%" cy="30%" r="100" />
              <circle cx="80%" cy="30%" r="150" />
              <circle cx="80%" cy="30%" r="200" />
              <circle cx="80%" cy="30%" r="250" />
              <circle cx="80%" cy="30%" r="300" strokeDasharray="10 20"/>

              <circle cx="20%" cy="75%" r="80" />
              <circle cx="20%" cy="75%" r="160" />
              <circle cx="20%" cy="75%" r="240" />
              <circle cx="20%" cy="75%" r="320" strokeDasharray="5 20"/>
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Floating Center Content with Glassmorphism Overrides globally applied to auth cards */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 
          [&_.card]:!bg-white/50 [&_.card]:dark:!bg-slate-900/50 [&_.card]:!backdrop-blur-xl 
          [&_.card]:!border [&_.card]:!border-white/40 [&_.card]:dark:!border-white/10 
          [&_.card]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)] [&_.card]:dark:!shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          [&_.card]:!transition-all [&_.card]:!duration-500"
      >
        <Outlet />
      </motion.div>
    </div>
  );
};