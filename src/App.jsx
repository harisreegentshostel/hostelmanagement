import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

// Components
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import FoodManagement from './pages/FoodManagement';
import StudentPortal from './pages/StudentPortal';
import Login from './pages/Login';

import AdminLogin from './pages/AdminLogin';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/student-portal" element={<StudentPortal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={!session ? <AdminLogin /> : <Navigate to="/" replace />} />
      
      {/* Protected Routes */}
      <Route path="/" element={session ? <MainLayout session={session} /> : <Navigate to="/admin" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="payments" element={<Payments />} />
        <Route path="food" element={<FoodManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
