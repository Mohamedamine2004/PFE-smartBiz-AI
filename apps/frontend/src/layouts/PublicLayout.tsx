import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();

  // Si l'utilisateur est déjà connecté, il ne doit pas pouvoir voir le Login/Register
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};