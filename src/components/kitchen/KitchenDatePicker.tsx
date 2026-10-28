import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getTodayStr } from '../../lib/meals';

interface KitchenDatePickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const KitchenDatePicker: React.FC<KitchenDatePickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse selected date for initial calendar view
  const [viewYear, setViewYear] = useState(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  });

  // Whenever selectedDate changes, sync view
  useEffect(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [selectedDate]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        dayNum,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month trailing days to round grid to 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayStr = getTodayStr();

  const handlePickDate = (dateStr: string) => {
    onSelectDate(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    onSelectDate(todayStr);
    const parts = todayStr.split('-');
    setViewYear(parseInt(parts[0], 10));
    setViewMonth(parseInt(parts[1], 10) - 1);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Select Date"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-[#f5f5f7] border border-black/[0.08] text-xs font-semibold text-[#1d1d1f] cursor-pointer transition active:scale-95 shadow-2xs select-none"
      >
        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="font-mono text-[11px] sm:text-xs">
          {selectedDate === todayStr ? 'Today' : selectedDate}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#86868b] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1d1d1f]' : ''
          }`}
        />
      </button>

      {/* In-Canvas Custom Calendar Popover (contained strictly inside the mobile canvas) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.08] p-3.5 w-72 max-w-[calc(100vw-2rem)] select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-[#1d1d1f] tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name) => (
              <span
                key={name}
                className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider py-1"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((d, idx) => {
              const isSelected = d.dateStr === selectedDate;
              const isToday = d.dateStr === todayStr;

              return (
                <button
                  key={`${d.dateStr}-${idx}`}
                  type="button"
                  onClick={() => handlePickDate(d.dateStr)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c1c1e] text-white font-bold shadow-xs scale-105'
                      : isToday
                      ? 'bg-amber-500/10 text-amber-800 font-bold border border-amber-500/30'
                      : d.isCurrentMonth
                      ? 'text-[#1d1d1f] hover:bg-black/[0.05]'
                      : 'text-[#c7c7cc] hover:bg-black/[0.02]'
                  }`}
                >
                  {d.dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-3 pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-50 transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-[#86868b] hover:text-[#1d1d1f] px-2 py-1 rounded-lg hover:bg-black/[0.04] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
