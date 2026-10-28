import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath, type UserRole } from '../types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
        <Loader2 className="w-9 h-9 animate-spin text-[#011627] mb-3" />
        <p className="text-sm text-[#86868b] font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    const getLoginPath = () => {
      if (allowedRoles && allowedRoles.length > 0) {
        if (allowedRoles.includes('admin') || allowedRoles.includes('kitchen_staff')) {
          if (allowedRoles.includes('kitchen_staff') && !allowedRoles.includes('admin')) {
            return '/admin/login?staff';
          }
          return '/admin/login';
        }
      }
      return '/login';
    };

    return <Navigate to={getLoginPath()} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If user doesn't have permission for this route, redirect them to their rightful dashboard
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return <>{children}</>;
};
