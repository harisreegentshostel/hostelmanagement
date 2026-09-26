import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, UtensilsCrossed, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const MainLayout = ({ session }) => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Food Requests', path: '/food', icon: UtensilsCrossed },
  ];

  const getCurrentTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.startsWith('/students')) return 'Students';
    if (location.pathname.startsWith('/payments')) return 'Payments & Fees';
    if (location.pathname.startsWith('/food')) return 'Food Management';
    return 'Hostel OS';
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden font-sans">
      {/* Apple-style Sidebar */}
      <aside className="w-72 bg-[#fbfbfd]/85 backdrop-blur-2xl border-r border-black/[0.08] flex flex-col justify-between shrink-0 select-none z-20">
        <div>
          {/* Sidebar Header */}
          <div className="px-6 pt-6 pb-4">

            {/* Brand Title */}
            <div>
              <h1 className="text-base font-semibold text-[#1d1d1f] tracking-tight leading-tight">Hostel OS</h1>
              <p className="text-xs text-[#86868b] font-normal">Administration</p>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="px-4 py-2">
            <div className="px-3 mb-2 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
              Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#0071e3] text-white shadow-[0_4px_12px_rgba(0,113,227,0.25)]' 
                        : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-[#86868b]'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-black/[0.06]">
          {/* Admin User Info & Logout */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#e8e8ed] flex items-center justify-center text-xs font-semibold text-[#1d1d1f] shrink-0 border border-black/[0.06]">
                {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-[#1d1d1f] truncate">
                  {session?.user?.email || 'Admin'}
                </p>
                <p className="text-[10px] text-[#86868b] truncate">Administrator</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-[#86868b] hover:text-[#ff3b30] hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-95 shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f5f7]">
        {/* Apple-style Frosted Top Navigation Bar */}
        <header className="h-16 shrink-0 bg-white/75 backdrop-blur-xl border-b border-black/[0.06] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#86868b] font-medium tracking-tight">Hostel</span>
            <span className="text-xs text-[#86868b]">/</span>
            <h2 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">{getCurrentTitle()}</h2>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
