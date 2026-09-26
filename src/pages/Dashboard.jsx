import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Users, AlertCircle, Clock, CheckCircle2, Utensils, Coffee, Sun, Moon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    upToDate: 0,
    dueToday: 0,
    overdue: 0,
  });
  
  const [food, setFood] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch active students
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('fee_due_date')
      .eq('status', 'active');
      
    if (!studentError && students) {
      let dueTodayCount = 0;
      let overdueCount = 0;
      let upToDateCount = 0;
      
      students.forEach(student => {
        if (!student.fee_due_date) {
          overdueCount++;
        } else {
          const dueDate = parseISO(student.fee_due_date);
          if (isToday(dueDate)) {
            dueTodayCount++;
          } else if (isPast(dueDate)) {
            overdueCount++;
          } else {
            upToDateCount++;
          }
        }
      });
      
      setStats({
        totalStudents: students.length,
        dueToday: dueTodayCount,
        overdue: overdueCount,
        upToDate: upToDateCount
      });
    }

    // Fetch today's food records
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data: foodRecords, error: foodError } = await supabase
      .from('meal_requests')
      .select('breakfast, lunch, dinner')
      .eq('date', todayStr);

    if (!foodError && foodRecords) {
      const foodData = { breakfast: 0, lunch: 0, dinner: 0 };
      foodRecords.forEach(record => {
        if (record.breakfast) foodData.breakfast++;
        if (record.lunch) foodData.lunch++;
        if (record.dinner) foodData.dinner++;
      });
      setFood(foodData);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/students"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-black/[0.08] rounded-lg shadow-sm transition-all duration-200 active:scale-95"
          >
            <span>Manage Students</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#86868b]" />
          </Link>
          <Link
            to="/payments"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition-all duration-200 active:scale-95"
          >
            <span>Collect Fees</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="apple-card p-6 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Total Residents</span>
            <div className="w-9 h-9 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
              {loading ? (
                <div className="h-9 w-16 bg-black/[0.06] rounded-md animate-pulse" />
              ) : (
                stats.totalStudents
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-1 font-medium">Active hostel members</p>
          </div>
        </div>

        {/* Up To Date */}
        <div className="apple-card p-6 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Up To Date</span>
            <div className="w-9 h-9 rounded-lg bg-[#34c759]/10 text-[#248a3d] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#248a3d]">
              {loading ? (
                <div className="h-9 w-16 bg-black/[0.06] rounded-md animate-pulse" />
              ) : (
                stats.upToDate
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-1 font-medium">Fees settled & current</p>
          </div>
        </div>

        {/* Due Today */}
        <div className="apple-card p-6 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Due Today</span>
            <div className="w-9 h-9 rounded-lg bg-[#5856d6]/10 text-[#5856d6] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#5856d6]">
              {loading ? (
                <div className="h-9 w-16 bg-black/[0.06] rounded-md animate-pulse" />
              ) : (
                stats.dueToday
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-1 font-medium">Scheduled for collection</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="apple-card p-6 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Overdue</span>
            <div className="w-9 h-9 rounded-lg bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#ff3b30]">
              {loading ? (
                <div className="h-9 w-16 bg-black/[0.06] rounded-md animate-pulse" />
              ) : (
                stats.overdue
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-1 font-medium">Requires follow up</p>
          </div>
        </div>
      </div>
      
      {/* Today's Meals Section - Apple Fitness / Health Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Today's Kitchen Demand</h2>
            <p className="text-xs text-[#86868b] font-medium mt-0.5">Meal selections recorded for {format(new Date(), 'dd MMMM')}</p>
          </div>
          <Link 
            to="/food" 
            className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1"
          >
            View Food Roster <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Breakfast */}
          <div className="apple-card p-6 bg-white relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">Breakfast</h3>
                  <p className="text-xs text-[#86868b]">Morning Service</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-md">
                7:30 - 9:30 AM
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
                {loading ? '-' : food.breakfast}
              </span>
              <span className="text-xs text-[#86868b] font-medium">servings opted-in</span>
            </div>
          </div>

          {/* Lunch */}
          <div className="apple-card p-6 bg-white relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">Lunch</h3>
                  <p className="text-xs text-[#86868b]">Afternoon Service</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-md">
                12:30 - 2:30 PM
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
                {loading ? '-' : food.lunch}
              </span>
              <span className="text-xs text-[#86868b] font-medium">servings opted-in</span>
            </div>
          </div>

          {/* Dinner */}
          <div className="apple-card p-6 bg-white relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5856d6]/10 text-[#5856d6] flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">Dinner</h3>
                  <p className="text-xs text-[#86868b]">Evening Service</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-md">
                7:30 - 9:30 PM
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
                {loading ? '-' : food.dinner}
              </span>
              <span className="text-xs text-[#86868b] font-medium">servings opted-in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
