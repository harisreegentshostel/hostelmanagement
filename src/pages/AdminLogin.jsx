import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
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
          to="/login" 
          className="text-xs font-medium text-[#0071e3] hover:underline"
        >
          Resident Sign In
        </Link>
      </div>

      {/* Main Admin Card */}
      <div className="w-full max-w-[420px] mx-auto my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="apple-card bg-white p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-black/[0.08]">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-lg bg-[#1d1d1f] text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-black/10">
              <Shield className="w-7 h-7 text-[#0071e3]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Hostel Admin</h1>
            <p className="text-xs text-[#86868b] mt-1.5 font-normal">
              Sign in with your administrative credentials to manage residents and billing.
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3.5 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-lg flex items-start gap-2.5 text-xs text-[#d70015]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@hostel.edu"
                  className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-medium text-sm text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm hover:shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#86868b] max-w-5xl mx-auto w-full">
        <p>Hostel OS Administrative Console • Apple Style Architecture</p>
      </div>
    </div>
  );
};

export default AdminLogin;
