import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Utensils,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { user, role, signIn, signOut, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle between 'admin' and 'staff' (Kitchen Staff)
  const [portalType, setPortalType] = useState<'admin' | 'staff'>(() => {
    if (location.search.includes('staff') || location.search.includes('kitchen')) {
      return 'staff';
    }
    return 'admin';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated with an admin or staff role, redirect to appropriate workspace
  useEffect(() => {
    if (user && role) {
      if (role === 'admin') {
        const destination =
          (location.state as any)?.from?.pathname?.startsWith('/admin')
            ? (location.state as any).from.pathname
            : '/admin';
        navigate(destination, { replace: true });
      } else if (role === 'kitchen_staff') {
        const destination =
          (location.state as any)?.from?.pathname?.startsWith('/kitchen')
            ? (location.state as any).from.pathname
            : '/kitchen';
        navigate(destination, { replace: true });
      }
    }
  }, [user, role, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    clearAuthError();
    setLoading(true);

    try {
      const { error: signInError, role: detectedRole } = await signIn(cleanEmail, password);
      setLoading(false);

      if (signInError) {
        setError(signInError);
        return;
      }

      // Check detected role and redirect accordingly
      if (detectedRole === 'admin') {
        const target =
          (location.state as any)?.from?.pathname?.startsWith('/admin')
            ? (location.state as any).from.pathname
            : '/admin';
        navigate(target, { replace: true });
      } else if (detectedRole === 'kitchen_staff') {
        const target =
          (location.state as any)?.from?.pathname?.startsWith('/kitchen')
            ? (location.state as any).from.pathname
            : '/kitchen';
        navigate(target, { replace: true });
      } else {
        // Reject accounts that are not hostel staff or admin (e.g. resident)
        await signOut();
        setError(
          'Access Denied: This portal is strictly for hostel staff and administrators. Resident accounts must log in via the Resident Portal.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'An unexpected error occurred during sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="w-full max-w-md z-10">
        {/* Dynamic Brand Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-md mb-3.5 transition-colors ${
              portalType === 'admin' ? 'bg-[#011627]' : 'bg-amber-800'
            }`}
          >
            {portalType === 'admin' ? (
              <Shield className="w-7 h-7 text-white" />
            ) : (
              <Utensils className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
              Harisree Hostel
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                portalType === 'admin'
                  ? 'bg-[#011627] text-white'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              {portalType === 'admin' ? 'Admin' : 'Kitchen Staff'}
            </span>
          </div>
          <p className="text-[#86868b] text-sm mt-1.5">
            {portalType === 'admin'
              ? 'Administrator Management Portal'
              : 'Daily Mess & Kitchen Operations Portal'}
          </p>
        </div>

        {/* Global Auth Error Banner */}
        {authError && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-900">Access Denied</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-3xl p-6 sm:p-8 space-y-5">
          {/* Segmented Toggle: Admin vs Staff */}
          <div className="grid grid-cols-2 p-1 bg-[#efeff4] rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setPortalType('admin');
                setError(null);
                clearAuthError();
              }}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                portalType === 'admin'
                  ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Shield className="w-4 h-4 text-[#011627]" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalType('staff');
                setError(null);
                clearAuthError();
              }}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                portalType === 'staff'
                  ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Utensils className="w-4 h-4 text-amber-800" />
              <span>Staff</span>
            </button>
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">
              {portalType === 'admin' ? 'Administrator Sign In' : 'Kitchen Staff Sign In'}
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5 leading-relaxed">
              {portalType === 'admin'
                ? 'Enter your administrator credentials to manage admissions, billing, and hostel operations.'
                : 'Enter your staff credentials to manage meal attendance and daily kitchen counts.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                {portalType === 'admin' ? 'Administrator Email' : 'Kitchen Staff Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    portalType === 'admin'
                      ? 'admin@harisreehostel.com'
                      : 'staff@harisreehostel.com'
                  }
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-black/[0.1] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] transition outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f5f5f7] border border-black/[0.1] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] ${
                portalType === 'admin'
                  ? 'bg-[#011627] hover:bg-[#0b253a]'
                  : 'bg-amber-800 hover:bg-amber-900'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {portalType === 'admin' ? 'Sign In as Admin' : 'Sign In as Staff'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-7 text-xs text-[#86868b]">
          Harisree Hostel Management • {portalType === 'admin' ? 'Admin Portal' : 'Kitchen Staff Portal'}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
