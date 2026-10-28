import React from 'react';
import {
  Building2,
  LayoutDashboard,
  Utensils,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export type ResidentTab = 'overview' | 'meals' | 'fees' | 'account';

interface ResidentSidebarProps {
  activeTab: ResidentTab;
  setActiveTab: (tab: ResidentTab) => void;
  residentName: string;
  admissionNo: number;
  pendingBalance: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export const ResidentSidebar: React.FC<ResidentSidebarProps> = ({
  activeTab,
  setActiveTab,
  residentName,
  admissionNo,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    {
      id: 'overview' as ResidentTab,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Hostel overview & quick metrics',
    },
    {
      id: 'meals' as ResidentTab,
      label: 'Daily Meals',
      icon: Utensils,
      description: 'Breakfast, lunch & dinner preferences',
    },
    {
      id: 'fees' as ResidentTab,
      label: 'Fees & Dues',
      icon: CreditCard,
      description: 'Monthly rent, deposit & dues',
    },
    {
      id: 'account' as ResidentTab,
      label: 'Account',
      icon: User,
      description: 'Resident details & sign out',
    },
  ];

  const handleTabClick = (tabId: ResidentTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

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
            onClick={() => handleTabClick('overview')}
            title="Harisree Hostel - Resident Portal"
          >
            <div className="w-9 h-9 rounded-xl bg-[#011627] flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm tracking-tight text-[#1d1d1f] truncate">
                  Harisree Hostel
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-lg hover:bg-black/[0.04] transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
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

        {/* Desktop Expand Button when collapsed */}
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

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
              Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={collapsed ? `${item.label}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer relative group ${
                  isActive
                    ? 'bg-[#011627] text-white font-semibold shadow-sm'
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-black/[0.04] font-medium'
                } ${collapsed ? 'justify-center px-2 py-3' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#86868b] group-hover:text-[#011627]'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {collapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#011627] rounded-r" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Resident Profile & Sign Out */}
        <div className="p-3 border-t border-black/[0.08] bg-[#fafafc]">
          <div
            className={`flex items-center gap-2.5 ${
              collapsed ? 'justify-center flex-col' : 'justify-between'
            }`}
          >
            <div
              className={`flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition ${
                collapsed ? 'justify-center' : ''
              }`}
              onClick={() => handleTabClick('account')}
              title={`View Account - ${residentName} (${user?.email})`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                {residentName ? residentName.charAt(0).toUpperCase() : 'R'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1d1d1f] truncate">
                    {residentName}
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate font-mono">
                    Adm #{admissionNo}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out of Resident Portal"
              className={`p-2 rounded-xl text-[#86868b] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer ${
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (Slide-in) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-black/[0.08] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Resident Mobile Navigation"
      >
        {renderSidebarContent(true)}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-black/[0.08] bg-white shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Resident Desktop Navigation"
      >
        {renderSidebarContent(false)}
      </aside>
    </>
  );
};
