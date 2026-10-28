import React from 'react';
import { UtensilsCrossed, User } from 'lucide-react';
import type { KitchenView } from './KitchenSidebar';

interface StaffFloatingBottomNavProps {
  activeView: KitchenView;
  setActiveView: (view: KitchenView) => void;
  onRefresh?: () => void;
}

export const StaffFloatingBottomNav: React.FC<StaffFloatingBottomNavProps> = ({
  activeView,
  setActiveView,
  onRefresh,
}) => {
  const handleTabClick = (view: KitchenView) => {
    if (activeView === view) {
      // Re-tapping active tab triggers smooth refresh & scrolls to top
      onRefresh?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveView(view);
    }
  };

  const navItems = [
    {
      id: 'overview' as KitchenView,
      label: 'Meal Service',
      icon: UtensilsCrossed,
    },
    {
      id: 'account' as KitchenView,
      label: 'Staff Account Management',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Staff mobile navigation"
      className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 select-none pb-[env(safe-area-inset-bottom,0px)] pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 p-1.5 px-2 sm:px-2.5 rounded-full bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-[22px] bg-black/[0.08] text-[#011627]'
                  : 'p-2 sm:p-2.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.4 : 2}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
