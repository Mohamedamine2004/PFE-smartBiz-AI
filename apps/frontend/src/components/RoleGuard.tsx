import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  allowedRoles: Array<'OWNER' | 'ADMIN' | 'COLLAB' | 'READER' | 'USER'>;
  children: ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, myCompanies } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const activeCompany = myCompanies.find((c) => c.companyId === user?.companyId);
  const userRole = activeCompany?.role || user?.role;

  if (!allowedRoles.includes(userRole)) {
    // Redirection vers le dashboard si l'utilisateur n'a pas les droits requis
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
