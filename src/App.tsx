import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getRoleDashboardPath } from './types/auth';

// Route-level code splitting for performance optimization
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const KitchenDashboard = lazy(() => import('./pages/kitchen/KitchenDashboard').then((m) => ({ default: m.KitchenDashboard })));
const ResidentDashboard = lazy(() => import('./pages/resident/ResidentDashboard').then((m) => ({ default: m.ResidentDashboard })));

// Minimalist Apple-style page loader fallback during lazy module fetch
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
    <div className="w-9 h-9 border-3 border-[#011627] border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs text-[#86868b] font-medium tracking-wide">Loading workspace...</span>
  </div>
);

// Root redirect handler based on authenticated status and role
const RootRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleDashboardPath(role)} replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Resident Authentication */}
            <Route path="/login" element={<Login />} />

            {/* Unified Admin & Staff Login with Toggle */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Fallbacks for Legacy Login URLs */}
            <Route path="/kitchen/login" element={<Navigate to="/admin/login?staff" replace />} />
            <Route path="/staff/login" element={<Navigate to="/admin/login?staff" replace />} />
            <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/resident/login" element={<Navigate to="/login" replace />} />

            {/* Admin Protected Module */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Kitchen Staff Protected Module */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={['kitchen_staff']}>
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />

            {/* Resident Protected Module */}
            <Route
              path="/resident"
              element={
                <ProtectedRoute allowedRoles={['resident']}>
                  <ResidentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Smart Root Index Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
