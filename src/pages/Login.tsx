import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../types/auth';
import {
  Building2,
  Mail,
  Loader2,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export const Login: React.FC = () => {
  const { user, role, sendMagicLink, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Resident magic link state
  const [residentEmail, setResidentEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already authenticated via Supabase session, redirect to role dashboard
  useEffect(() => {
    if (user && role) {
      const destination = (location.state as any)?.from?.pathname || getRoleDashboardPath(role);
      navigate(destination, { replace: true });
    }
  }, [user, role, navigate, location]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Resident Magic Link Request
  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = residentEmail.trim().toLowerCase();
    if (!targetEmail) {
      setMagicLinkError('Please enter your email address.');
      return;
    }

    setMagicLinkError(null);
    clearAuthError();
    setMagicLinkLoading(true);

    const result = await sendMagicLink(targetEmail);
    setMagicLinkLoading(false);

    if (!result.success) {
      setMagicLinkError(result.error);
    } else {
      setMagicLinkSent(true);
      setResendCooldown(30);
    }
  };

  // Handle Resend Magic Link
  const handleResend = async () => {
    if (resendCooldown > 0 || !residentEmail.trim()) return;
    setMagicLinkLoading(true);
    setMagicLinkError(null);

    const result = await sendMagicLink(residentEmail.trim().toLowerCase());
    setMagicLinkLoading(false);

    if (!result.success) {
      setMagicLinkError(result.error);
    } else {
      setResendCooldown(30);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#011627] text-white shadow-md mb-3.5">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
              Harisree Hostel
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#011627] text-white tracking-wide uppercase">
              Resident
            </span>
          </div>
          <p className="text-[#86868b] text-sm mt-1.5">
            Student & Resident Self-Service Portal
          </p>
        </div>

        {/* Auth Error Banner (e.g. from unregistered session rejection) */}
        {authError && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-900">Access Denied</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Resident Login Card */}
        <div className="bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-3xl p-6 sm:p-8">
          {magicLinkSent ? (
            /* Success Screen: Check Email */
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1d1d1f]">Check Your Email</h3>
                <p className="text-xs text-[#86868b] mt-1.5 leading-relaxed">
                  We sent a secure magic login link to:
                </p>
                <p className="text-sm font-mono font-semibold text-[#011627] mt-1 break-all bg-[#f5f5f7] py-2 px-3 rounded-xl border border-black/[0.06]">
                  {residentEmail}
                </p>
              </div>

              <p className="text-xs text-[#6e6e73] leading-relaxed bg-[#f5f5f7] p-3 rounded-xl border border-black/[0.06]">
                Open your email inbox and tap the <strong className="text-[#1d1d1f]">Log In</strong> button. You will be logged in immediately without a password.
              </p>

              {magicLinkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                  {magicLinkError}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || magicLinkLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-[#efeff4] hover:bg-[#e5e5ea] text-[#1d1d1f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {magicLinkLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#011627]" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-[#86868b]" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `Resend link in ${resendCooldown}s`
                      : 'Resend Magic Link'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setMagicLinkError(null);
                  }}
                  className="text-xs text-[#011627] hover:underline transition py-1 cursor-pointer font-medium"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            /* Form: Request Magic Link */
            <form onSubmit={handleResidentSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Resident Portal Login</h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Enter your registered email to receive an instant Magic Login Link.
                </p>
              </div>

              {magicLinkError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">{magicLinkError}</div>
                </div>
              )}

              {/* Registered Email Field */}
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                  Hostel Registered Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={residentEmail}
                    onChange={(e) => setResidentEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-black/[0.1] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] transition outline-none"
                  />
                </div>
              </div>

              {/* Security enforcement badge */}
              <div className="p-3.5 rounded-2xl bg-[#011627]/5 border border-[#011627]/15 text-[#1d1d1f] text-[11px] leading-relaxed flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#011627] shrink-0 mt-0.5" />
                <span className="text-[#6e6e73]">
                  <strong className="text-[#1d1d1f]">Strict Security:</strong> Only email addresses registered by the hostel admin can receive a login link and access resident features.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={magicLinkLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm bg-[#011627] hover:bg-[#0b253a] text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                {magicLinkLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Sending Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Magic Login Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* PWA footer */}
        <div className="text-center mt-7 text-xs text-[#86868b]">
          Installable PWA • Harisree Hostel Resident Portal
        </div>
      </div>
    </div>
  );
};
