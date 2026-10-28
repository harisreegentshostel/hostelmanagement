import React from 'react';
import {
  Building2,
  LayoutDashboard,
  Users,
  Utensils,
  CreditCard,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  RefreshCw,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export type AdminTab = 'overview' | 'residents' | 'meals' | 'dues' | 'account';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  residentCount: number;
  pendingCount: number;
  onOpenAddResident: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  residentCount,
  pendingCount,
  onOpenAddResident,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onRefresh,
  loading = false,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Hostel Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      description: 'Overview, students & today’s food',
    },
    {
      id: 'residents' as AdminTab,
      label: 'Resident Admissions',
      shortLabel: 'Admissions',
      icon: Users,
      badge: String(residentCount),
      badgeColor: 'bg-[#011627]/[0.08] text-[#011627] border-[#011627]/20',
      description: 'Hostel admissions & student records',
    },
    {
      id: 'meals' as AdminTab,
      label: 'Daily Mess Attendance',
      shortLabel: 'Mess & Food',
      icon: Utensils,
      badge: 'Live',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      description: 'Breakfast, lunch & dinner logs',
    },
    {
      id: 'dues' as AdminTab,
      label: 'Fee Details & Dues',
      shortLabel: 'Fee Details',
      icon: CreditCard,
      badge: pendingCount > 0 ? `${pendingCount}` : '0',
      badgeColor:
        pendingCount > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200/60'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      description: 'Monthly rent, caution deposits & dues',
    },
    {
      id: 'account' as AdminTab,
      label: 'Account Management',
      shortLabel: 'Account',
      icon: User,
      badge: 'Admin',
      badgeColor: 'bg-[#011627]/[0.08] text-[#011627] border-[#011627]/20',
      description: 'Profile, security & system settings',
    },
  ];

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  // Content for both Desktop and Mobile Drawer
  const renderSidebarContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full select-none bg-white">
        {/* Brand Header */}
        <div className="p-4 border-b border-black/[0.08] flex items-center justify-between">
          <div
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${
              collapsed ? 'justify-center w-full' : ''
            }`}
            onClick={() => handleTabClick('residents')}
            title="Harisree Hostel - Admin Portal"
          >
            <div className="w-9 h-9 rounded-xl bg-[#011627] flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm tracking-tight text-[#1d1d1f] truncate">
                  Harisree Hostel
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-[#011627] bg-[#011627]/10 px-1.5 py-0.5 rounded-md border border-[#011627]/20">
                    <Shield className="w-2.5 h-2.5" />
                    Admin Portal
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Close button on mobile drawer */}
          {isMobile ? (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-lg hover:bg-black/[0.04] transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            /* Collapse toggle button on desktop */
            !collapsed && (
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="hidden lg:flex p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-lg hover:bg-black/[0.04] transition cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Desktop Collapse Expand Toggle Button (when collapsed) */}
        {!isMobile && collapsed && (
          <div className="p-2 border-b border-black/[0.08] flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-lg hover:bg-black/[0.04] transition cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onOpenAddResident();
              if (isMobile) setIsMobileOpen(false);
            }}
            title={collapsed ? 'Add New Resident' : undefined}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#011627] hover:bg-[#0b253a] text-white font-medium text-xs shadow-sm transition-all cursor-pointer active:scale-[0.99] ${
              collapsed ? 'p-2.5' : ''
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Add New Resident</span>}
          </button>

          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                if (isMobile) setIsMobileOpen(false);
              }}
              disabled={loading}
              title={collapsed ? 'Refresh Data' : undefined}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-[#f5f5f7] border border-black/[0.1] text-[#1d1d1f] font-medium text-xs transition cursor-pointer active:scale-[0.99] ${
                collapsed ? 'p-2' : ''
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#011627]' : 'text-[#86868b]'}`}
              />
              {!collapsed && <span>Refresh Data</span>}
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
              Management
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={collapsed ? `${item.label} (${item.badge})` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer relative group ${
                  isActive
                    ? 'bg-[#011627] text-white font-semibold shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] font-medium'
                } ${collapsed ? 'justify-center px-2 py-3' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#86868b] group-hover:text-[#011627]'
                  }`}
                />

                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30 font-bold'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  </>
                )}

                {/* Collapsed Active Indicator Pill */}
                {collapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#011627] rounded-r" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Admin Profile & Sign Out */}
        <div className="p-3 border-t border-black/[0.08] bg-[#fafafc]">
          <div
            className={`flex items-center gap-2.5 ${
              collapsed ? 'justify-center flex-col' : 'justify-between'
            }`}
          >
            <div
              className={`flex items-center gap-2.5 min-w-0 ${
                collapsed ? 'justify-center' : ''
              }`}
              title={user?.email || 'Admin'}
            >
              <div className="w-8 h-8 rounded-lg bg-[#011627]/10 border border-[#011627]/20 text-[#011627] flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1d1d1f] truncate">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate font-mono">
                    {user?.email}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out of Admin Portal"
              className={`p-2 rounded-lg text-[#86868b] hover:text-[#ff3b30] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer ${
                collapsed ? 'mt-2' : ''
              }`}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (Slide-in) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-black/[0.08] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation"
      >
        {renderSidebarContent(true)}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-black/[0.08] bg-white shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Desktop Navigation"
      >
        {renderSidebarContent(false)}
      </aside>
    </>
  );
};
