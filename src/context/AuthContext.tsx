import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { resolveUserRole, type UserRole, type ResidentRecord } from '../types/auth';
import { sendResidentMagicLink } from '../lib/residentAuth';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  session: Session | null;
  residentProfile: ResidentRecord | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: UserRole | null }>;
  sendMagicLink: (email: string) => Promise<{ error: string | null; success: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [residentProfile, setResidentProfile] = useState<ResidentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Sync resident profile & enforce registration validation for resident role
  const handleUserSession = useCallback(async (currentSession: Session | null) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;

    if (!currentUser) {
      setUser(null);
      setRole(null);
      setResidentProfile(null);
      setLoading(false);
      return;
    }

    const detectedRole = resolveUserRole(currentUser);

    // If the user is identified as a resident, verify their email in public.residents
    if (detectedRole === 'resident') {
      try {
        const userEmail = (currentUser.email || '').trim().toLowerCase();
        const { data: resData, error: resError } = await supabase
          .from('residents')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle();

        if (resError || !resData) {
          // Resident email NOT found in admin database: reject session immediately
          console.warn('Unauthorized resident login attempt with unregistered email:', userEmail);
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          setResidentProfile(null);
          setAuthError(
            `Access Denied: The email "${currentUser.email}" is not registered in the hostel resident database. Only admin-registered residents may log in.`
          );
          setLoading(false);
          return;
        }

        // Resident is valid and registered by admin
        setResidentProfile(resData);
        setUser(currentUser);
        setRole('resident');
        setAuthError(null);
      } catch (err: any) {
        console.error('Failed to verify resident record:', err);
        setResidentProfile(null);
        setUser(currentUser);
        setRole('resident');
      }
    } else {
      // Admin or Kitchen Staff
      setUser(currentUser);
      setRole(detectedRole);
      setResidentProfile(null);
      setAuthError(null);
    }

    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user || role !== 'resident') return;
    try {
      const userEmail = (user.email || '').trim().toLowerCase();
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .ilike('email', userEmail)
        .maybeSingle();

      if (!error && data) {
        setResidentProfile(data);
      }
    } catch (err) {
      console.error('Error refreshing resident profile:', err);
    }
  }, [user, role]);

  useEffect(() => {
    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session);
    });

    // 2. Listen to ongoing auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSession]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null; role: UserRole | null }> => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message, role: null };
      }

      if (data.user) {
        const detectedRole = resolveUserRole(data.user);
        setUser(data.user);
        setRole(detectedRole);
        return { error: null, role: detectedRole };
      }

      return { error: 'Unknown authentication error', role: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in', role: null };
    }
  };

  const sendMagicLink = async (
    email: string
  ): Promise<{ error: string | null; success: boolean }> => {
    setAuthError(null);
    const result = await sendResidentMagicLink(email);
    if (!result.success && result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setSession(null);
    setResidentProfile(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        session,
        residentProfile,
        loading,
        authError,
        clearAuthError,
        signIn,
        sendMagicLink,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
