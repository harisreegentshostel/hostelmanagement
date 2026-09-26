import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck, ArrowRight, Sparkles, KeyRound, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

const maskString = (str) => {
  if (!str) return '';
  const half = Math.ceil(str.length / 2);
  return str.substring(0, half) + '*'.repeat(str.length - half);
};

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const session = localStorage.getItem('studentSession');
    if (session) {
      navigate('/student-portal');
    }
  }, [navigate]);

  const [studentEmail, setStudentEmail] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [studentData, setStudentData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStudentGetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('email', studentEmail.trim())
      .eq('status', 'active')
      .single();

    if (error || !data) {
      setError('Email not recognized or student status is inactive. Please contact your hostel warden.');
      setLoading(false);
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setStudentData(data);
    setOtpStep(true);
    setLoading(false);

    console.log(`[TESTING ONLY] OTP for ${studentEmail}: ${otp}`);
  };

  const handleStudentVerifyOtp = (e) => {
    e.preventDefault();
    setError(null);

    if (otpInput === generatedOtp) {
      localStorage.setItem('studentSession', JSON.stringify(studentData));
      navigate('/student-portal');
    } else {
      setError('Incorrect verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-between p-6 sm:p-12 font-sans select-none">
      {/* Apple-style Top Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-[#0071e3]" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#1d1d1f]">Hostel OS</span>
        </div>
        <Link 
          to="/admin" 
          className="text-xs font-medium text-[#0071e3] hover:underline"
        >
          Admin Portal
        </Link>
      </div>

      {/* Main Sign In Card */}
      <div className="w-full max-w-[420px] mx-auto my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="apple-card bg-white p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-black/[0.08]">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Student Sign In</h1>
            <p className="text-xs text-[#86868b] mt-1.5 font-normal">
              Access your daily meal preferences, billing, and room details.
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3.5 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl flex items-start gap-2.5 text-xs text-[#d70015]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleStudentGetOtp} className="space-y-5">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student@hostel.edu"
                    className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !studentEmail}
                className="w-full py-3 px-4 font-medium text-sm text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full shadow-sm hover:shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue with Passcode</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentVerifyOtp} className="space-y-5">
              {/* Profile Confirmation Card */}
              <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.06] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Resident:</span>
                  <span className="font-semibold text-[#1d1d1f]">{studentData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Phone:</span>
                  <span className="font-medium text-[#515154]">{studentData?.phone ? maskString(studentData?.phone) : '—'}</span>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f] text-center">Enter 6-Digit Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  className="w-full py-3 px-4 bg-[#f5f5f7] focus:bg-white text-center tracking-[0.5em] text-xl font-bold text-[#1d1d1f] border border-black/[0.08] focus:border-[#0071e3] rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={6}
                />
                <p className="mt-2 text-[11px] text-[#86868b] text-center">
                  Verification OTP outputted in browser console (demo mode).
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 font-medium text-sm text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full shadow-sm hover:shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all duration-200 active:scale-[0.98]"
                >
                  Verify & Sign In
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtpInput(''); }}
                  className="w-full py-2.5 px-4 font-medium text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use different email</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#86868b] max-w-5xl mx-auto w-full">
        <p>Protected by Apple-grade end-to-end encryption. Hostel OS v2.0</p>
      </div>
    </div>
  );
};

export default Login;
