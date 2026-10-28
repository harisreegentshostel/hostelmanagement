import React from 'react';
import {
  Building2,
  Utensils,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Coffee,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { DailyMealSummary, MealType } from '../../types/meals';
import { getMealTimeWindow } from '../../lib/meals';

export type KitchenView = 'overview' | 'account';

interface KitchenSidebarProps {
  activeView: KitchenView;
  setActiveView: (view: KitchenView) => void;
  currentMealType: MealType;
  summary: DailyMealSummary;
  selectedDate: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export const KitchenSidebar: React.FC<KitchenSidebarProps> = ({
  activeView,
  setActiveView,
  currentMealType,
  summary: _summary,
  selectedDate,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login?staff');
  };

  const mealName =
    currentMealType === 'breakfast'
      ? 'Breakfast'
      : currentMealType === 'lunch'
      ? 'Lunch'
      : 'Dinner';

  const MealIcon =
    currentMealType === 'breakfast'
      ? Coffee
      : currentMealType === 'lunch'
      ? Sun
      : Moon;

  const navItems = [
    {
      id: 'overview' as KitchenView,
      label: 'Meal Service',
      icon: Clock,
    },
    {
      id: 'account' as KitchenView,
      label: 'Account Details',
      icon: User,
    },
  ];

  const handleTabClick = (viewId: KitchenView) => {
    setActiveView(viewId);
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
            onClick={() => handleTabClick('overview')}
            title="Harisree Hostel - Kitchen Portal"
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
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-amber-800 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                    <Utensils className="w-2.5 h-2.5" />
                    Kitchen Portal
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

        {/* Desktop Expand Toggle Button (when collapsed) */}
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

        {/* Live Service Banner (Expanded only) */}
        {!collapsed && (
          <div className="p-3 space-y-2">
            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-amber-900">
                  <MealIcon className="w-3.5 h-3.5 text-amber-700" />
                  Live Session
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#1d1d1f]">{mealName}</span>
                <span className="text-[11px] font-mono text-[#86868b]">{getMealTimeWindow(currentMealType)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
              <span className="text-[#86868b]">Date:</span>
              <span className="font-mono text-[#1d1d1f] font-semibold">{selectedDate}</span>
            </div>
          </div>
        )}

        {/* Navigation Menu (Exactly 2 items) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
              Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer relative group ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] font-medium'
                } ${collapsed ? 'justify-center px-2 py-3' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#86868b] group-hover:text-amber-700'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 text-left font-medium">
                    {item.label}
                  </span>
                )}

                {/* Collapsed Active Indicator Pill */}
                {collapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-600 rounded-r" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Kitchen Staff Profile & Sign Out */}
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
              title={user?.email || 'Kitchen Staff'}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                KS
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1d1d1f] truncate">
                    Kitchen Staff
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate font-mono">
                    {user?.email}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out of Kitchen Portal"
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
