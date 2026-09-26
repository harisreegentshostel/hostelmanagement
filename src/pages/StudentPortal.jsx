import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';
import { 
  Home, 
  CreditCard, 
  Activity, 
  User, 
  Coffee, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck,
  Phone,
  Hash,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Apple iOS Style Interactive Toggle Control
const AppleMealToggle = ({ checked, onChange, title, subtitle, icon: Icon, activeColorClass, iconBgClass }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between ${
      checked 
        ? 'bg-white border-black/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.04)]' 
        : 'bg-[#fbfbfd] border-black/[0.04] opacity-80 hover:opacity-100'
    }`}
  >
    <div className="flex items-center gap-3.5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
        checked ? iconBgClass : 'bg-[#e8e8ed] text-[#86868b]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-base font-semibold text-[#1d1d1f] leading-tight">{title}</h4>
        <p className="text-xs text-[#86868b] font-medium mt-0.5">{subtitle}</p>
      </div>
    </div>

    {/* iOS Toggle Switch */}
    <div className={`relative w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
      checked ? (activeColorClass || 'bg-[#34c759]') : 'bg-[#e5e5ea]'
    }`}>
      <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </div>
  </div>
);

const StudentPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'fees', 'activity', 'profile'
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Food state
  const [meals, setMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [savedMeals, setSavedMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [monthlyMeals, setMonthlyMeals] = useState([]);
  const [success, setSuccess] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedActivityDate, setSelectedActivityDate] = useState(null);

  // Fees state
  const [payments, setPayments] = useState([]);
  const [feesLoading, setFeesLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('studentSession');
    if (!session) {
      navigate('/login');
      return;
    }
    
    const student = JSON.parse(session);
    fetchLatestStudentData(student.id);
  }, [navigate]);

  useEffect(() => {
    if (selectedStudent) {
      if (activeTab === 'home') {
        fetchExistingRequest(selectedStudent.id);
        fetchMonthlyRequests(selectedStudent.id, selectedMonth);
      } else if (activeTab === 'fees') {
        fetchPayments(selectedStudent);
      } else if (activeTab === 'activity') {
        fetchMonthlyRequests(selectedStudent.id, selectedMonth);
      }
    }
  }, [activeTab, selectedStudent, selectedMonth]);

  const fetchLatestStudentData = async (studentId) => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
      
    if (data) {
      setSelectedStudent(data);
      localStorage.setItem('studentSession', JSON.stringify(data));
    }
  };

  const fetchExistingRequest = async (studentId) => {
    setLoading(true);
    const { data } = await supabase
      .from('meal_requests')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', todayStr)
      .single();

    if (data) {
      const fetchedMeals = {
        breakfast: data.breakfast || false,
        lunch: data.lunch || false,
        dinner: data.dinner || false
      };
      setMeals(fetchedMeals);
      setSavedMeals(fetchedMeals);
    }
    setLoading(false);
  };

  const fetchMonthlyRequests = async (studentId, monthStr) => {
    const monthDate = parseISO(monthStr + '-01');
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('meal_requests')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', start)
      .lte('date', end);

    if (data) {
      setMonthlyMeals(data);
    }
  };

  const fetchPayments = async (student) => {
    if (!student?.id) return;
    setFeesLoading(true);
    
    try {
      // 1. Attempt secure RPC call (validates student id + email)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_student_payments', {
          p_student_id: student.id,
          p_email: student.email || ''
        });

      if (!rpcError && rpcData) {
        setPayments(rpcData);
      } else {
        // 2. Direct query fallback
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', student.id)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPayments(data);
        } else if (error) {
          console.error('Error fetching payments:', error);
        }
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('meal_requests')
      .upsert({
        student_id: selectedStudent.id,
        date: todayStr,
        breakfast: meals.breakfast,
        lunch: meals.lunch,
        dinner: meals.dinner,
        created_at: new Date().toISOString()
      }, { onConflict: 'student_id,date' });

    if (error) {
      console.error(error);
      setError('Failed to save meal preferences. Please try again.');
    } else {
      setSuccess(true);
      setSavedMeals(meals);
      fetchMonthlyRequests(selectedStudent.id, selectedMonth);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const currentMonthDate = parseISO(selectedMonth + '-01');
  const currentMonthDays = eachDayOfInterval({
    start: startOfMonth(currentMonthDate),
    end: endOfMonth(currentMonthDate)
  });

  const getMealLevel = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const meal = monthlyMeals.find(m => m.date === dateStr);
    if (!meal) return 0;
    
    let count = 0;
    if (meal.breakfast) count++;
    if (meal.lunch) count++;
    if (meal.dinner) count++;
    return count;
  };

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/login');
  };

  if (!selectedStudent && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] text-[#86868b] gap-3">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Opening Hostel OS...</span>
      </div>
    );
  }

  const hasUnsavedChanges = meals.breakfast !== savedMeals.breakfast || 
                            meals.lunch !== savedMeals.lunch || 
                            meals.dinner !== savedMeals.dinner;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans pb-32">
      {/* Apple Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-black/[0.06] shadow-xs px-6 py-4 sm:py-5 min-h-[76px] sm:min-h-[84px] flex items-center">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setActiveTab('profile')}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] border border-black/[0.04] flex items-center justify-center text-[#0071e3] transition-all active:scale-95 cursor-pointer shrink-0"
              title="Profile"
              aria-label="Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#0071e3]" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                {selectedStudent?.name || 'Resident'}
              </h1>
              <p className="text-xs sm:text-sm text-[#86868b] font-medium mt-0.5">
                Room {selectedStudent?.room_number || '—'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#f5f5f7] hover:bg-[#ebebed] text-xs sm:text-sm font-semibold text-[#1d1d1f] border border-black/[0.05] rounded-full transition-all active:scale-95 cursor-pointer"
          >
            <span>Profile</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#86868b]" />
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-md mx-auto px-5 pt-5">
        {/* ===================== HOME (MEALS) TAB ===================== */}
        {activeTab === 'home' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            
            {/* Simple Minimal Apple Fee Card */}
            {(() => {
              const dueDate = selectedStudent?.fee_due_date ? parseISO(selectedStudent.fee_due_date) : null;
              const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;
              
              let badgeText = "All Paid";
              let badgeStyle = "bg-[#34c759]/10 text-[#248a3d]";

              if (daysLeft !== null) {
                if (daysLeft < 0) {
                  badgeText = "Overdue";
                  badgeStyle = "bg-[#ff3b30]/10 text-[#d70015]";
                } else if (daysLeft === 0) {
                  badgeText = "Due Today";
                  badgeStyle = "bg-[#ff9500]/10 text-[#b25000]";
                } else if (daysLeft <= 7) {
                  badgeText = `Due in ${daysLeft}d`;
                  badgeStyle = "bg-[#5856d6]/10 text-[#5856d6]";
                } else {
                  badgeText = `Due in ${daysLeft}d`;
                  badgeStyle = "bg-black/[0.04] text-[#86868b]";
                }
              }

              return (
                <div 
                  onClick={() => setActiveTab('fees')}
                  className="apple-card p-5 bg-white border border-black/[0.06] cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#86868b]">Monthly Fee</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
                        ₹{selectedStudent?.fee_amount?.toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-[#86868b] mt-1 font-medium">
                        {dueDate ? `Due date: ${format(dueDate, 'dd MMMM yyyy')}` : 'No due date set'}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-[#0071e3] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Apple Home Style Today's Plan */}
            <div className="apple-card p-5 sm:p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Kitchen Roster</p>
                  <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Today's Meals</h2>
                  <p className="text-xs text-[#86868b] mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
                </div>
                {success && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#34c759]/15 text-[#248a3d] text-xs font-semibold rounded-full animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-xl text-xs text-[#d70015] font-medium">
                  {error}
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 pt-1">
                <AppleMealToggle 
                  checked={meals.breakfast}
                  onChange={(val) => setMeals({...meals, breakfast: val})}
                  title="Breakfast"
                  subtitle="Morning service (7:30 - 9:30 AM)"
                  icon={Coffee}
                  iconBgClass="bg-[#ff9500]/15 text-[#ff9500]"
                  activeColorClass="bg-[#ff9500]"
                />

                <AppleMealToggle 
                  checked={meals.lunch}
                  onChange={(val) => setMeals({...meals, lunch: val})}
                  title="Lunch"
                  subtitle="Afternoon service (12:30 - 2:30 PM)"
                  icon={Sun}
                  iconBgClass="bg-[#0071e3]/15 text-[#0071e3]"
                  activeColorClass="bg-[#0071e3]"
                />

                <AppleMealToggle 
                  checked={meals.dinner}
                  onChange={(val) => setMeals({...meals, dinner: val})}
                  title="Dinner"
                  subtitle="Evening service (7:30 - 9:30 PM)"
                  icon={Moon}
                  iconBgClass="bg-[#5856d6]/15 text-[#5856d6]"
                  activeColorClass="bg-[#5856d6]"
                />
              </div>

              {/* Action Button */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  className="w-full mt-4 py-3.5 px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-medium text-sm shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Save Meal Preferences</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== ACTIVITY TAB ===================== */}
        {activeTab === 'activity' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="apple-card p-5 sm:p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.06] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Attendance</p>
                  <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Monthly Activity</h2>
                </div>

                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#f5f5f7] px-3 py-1.5 rounded-full text-xs font-semibold text-[#1d1d1f] border border-black/[0.08] outline-none cursor-pointer"
                />
              </div>

              {/* Apple Activity Intensity Legend */}
              <div className="flex items-center justify-between text-[11px] text-[#86868b] px-1">
                <span>0 meals</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-[#f5f5f7] border border-black/[0.04]" />
                  <div className="w-3.5 h-3.5 rounded-md bg-[#0071e3]/20" />
                  <div className="w-3.5 h-3.5 rounded-md bg-[#0071e3]/60" />
                  <div className="w-3.5 h-3.5 rounded-md bg-[#0071e3]" />
                </div>
                <span>3 meals</span>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-2 place-items-center">
                {['M','T','W','T','F','S','S'].map((day, idx) => (
                  <span key={idx} className="text-[10px] font-semibold text-[#86868b] mb-1">{day}</span>
                ))}
                {currentMonthDays.map(day => {
                  const level = getMealLevel(day);
                  let bgClass = "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]";
                  if (level === 1) bgClass = "bg-[#0071e3]/20 text-[#0071e3] font-semibold";
                  if (level === 2) bgClass = "bg-[#0071e3]/60 text-white font-semibold";
                  if (level === 3) bgClass = "bg-[#0071e3] text-white font-bold shadow-sm shadow-[#0071e3]/30";
                  
                  const isSelected = selectedActivityDate && format(day, 'yyyy-MM-dd') === format(selectedActivityDate, 'yyyy-MM-dd');

                  return (
                    <button 
                      key={day.toString()} 
                      onClick={() => setSelectedActivityDate(day)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bgClass} flex items-center justify-center text-xs transition-all duration-200 cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-105' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details Inspector */}
            {selectedActivityDate && (
              <div className="apple-card p-5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.06] animate-in fade-in duration-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                  <div>
                    <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Log Details</p>
                    <h3 className="text-base font-bold text-[#1d1d1f]">
                      {format(selectedActivityDate, 'EEEE, d MMMM yyyy')}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedActivityDate(null)} 
                    className="w-7 h-7 rounded-full bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] flex items-center justify-center text-sm font-semibold"
                  >
                    &times;
                  </button>
                </div>
                
                {(() => {
                  const dateStr = format(selectedActivityDate, 'yyyy-MM-dd');
                  const meal = monthlyMeals.find(m => m.date === dateStr);
                  
                  if (!meal || (!meal.breakfast && !meal.lunch && !meal.dinner)) {
                    return <p className="text-xs text-[#86868b] py-2 font-medium">No meal preferences logged for this date.</p>;
                  }

                  return (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className={`p-3 rounded-xl flex flex-col items-center text-center gap-1.5 ${meal.breakfast ? 'bg-[#ff9500]/10 text-[#b25000]' : 'bg-[#f5f5f7] text-[#a1a1a6]'}`}>
                        <Coffee className="w-4 h-4" />
                        <span className="text-xs font-semibold">{meal.breakfast ? 'Breakfast' : 'Skipped'}</span>
                      </div>
                      <div className={`p-3 rounded-xl flex flex-col items-center text-center gap-1.5 ${meal.lunch ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#f5f5f7] text-[#a1a1a6]'}`}>
                        <Sun className="w-4 h-4" />
                        <span className="text-xs font-semibold">{meal.lunch ? 'Lunch' : 'Skipped'}</span>
                      </div>
                      <div className={`p-3 rounded-xl flex flex-col items-center text-center gap-1.5 ${meal.dinner ? 'bg-[#5856d6]/10 text-[#5856d6]' : 'bg-[#f5f5f7] text-[#a1a1a6]'}`}>
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{meal.dinner ? 'Dinner' : 'Skipped'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===================== FEES TAB ===================== */}
        {activeTab === 'fees' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Apple Card Wallet Summary */}
            <div className="apple-wallet-card p-6 shadow-[0_12px_32px_rgba(0,0,0,0.2)] space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70 tracking-wider uppercase">Hostel Resident Pass</span>
              </div>

              <div>
                <p className="text-xs text-white/70">Monthly Fee</p>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mt-0.5">
                  ₹{selectedStudent?.fee_amount?.toLocaleString() || 0}
                </h2>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/15 text-xs">
                <div>
                  <p className="text-white/70">Next Billing Date</p>
                  <p className="font-semibold text-white mt-0.5">
                    {selectedStudent?.fee_due_date ? format(parseISO(selectedStudent.fee_due_date), 'dd MMMM yyyy') : 'Not Set'}
                  </p>
                </div>
                {(() => {
                  const dueDate = selectedStudent?.fee_due_date ? parseISO(selectedStudent.fee_due_date) : null;
                  const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;
                  
                  let statusText = "Up to date";
                  let badgeStyle = "bg-[#34c759]/25 text-[#34c759] border-[#34c759]/35";

                  if (daysLeft !== null) {
                    if (daysLeft < 0) {
                      statusText = "Overdue";
                      badgeStyle = "bg-[#ff3b30]/25 text-[#ff6961] border-[#ff3b30]/35";
                    } else if (daysLeft === 0) {
                      statusText = "Due Today";
                      badgeStyle = "bg-[#ff9500]/25 text-[#ffb340] border-[#ff9500]/35";
                    } else if (daysLeft <= 7) {
                      statusText = `Due in ${daysLeft}d`;
                      badgeStyle = "bg-[#5856d6]/25 text-[#a29bfe] border-[#5856d6]/35";
                    }
                  }

                  return (
                    <div>
                      <p className="text-white/70">Fee Status</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] mt-0.5 border ${badgeStyle}`}>
                        <CheckCircle2 className="w-3 h-3" /> {statusText}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Payment Receipts History */}
            <div className="apple-card p-5 sm:p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1d1d1f]">Payment History</h3>
                <span className="text-xs text-[#86868b]">{payments.length} receipts</span>
              </div>

              {feesLoading ? (
                <div className="text-center py-8 text-xs text-[#86868b] flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                  <span>Loading payment records...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 bg-[#f5f5f7] rounded-2xl">
                  <p className="text-xs text-[#86868b] font-medium">No payment history found</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {payments.map((payment) => (
                    <div key={payment.id} className="p-3.5 bg-[#fbfbfd] hover:bg-[#f5f5f7] border border-black/[0.04] rounded-2xl flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#34c759]/15 text-[#34c759] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1d1d1f]">Fee Payment</p>
                          <p className="text-[11px] text-[#86868b]">
                            {format(parseISO(payment.payment_date || payment.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#1d1d1f]">₹{payment.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== PROFILE TAB ===================== */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Identity Card */}
            <div className="apple-card p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.06] text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f7] border-2 border-white shadow-md flex items-center justify-center mx-auto text-2xl font-bold text-[#1d1d1f]">
                {selectedStudent?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1d1d1f]">{selectedStudent?.name}</h2>
                <p className="text-xs text-[#86868b] mt-0.5">{selectedStudent?.email}</p>
              </div>

              {/* Info Rows */}
              <div className="pt-2 text-left space-y-2 border-t border-black/[0.04]">
                <div className="flex items-center justify-between py-2 px-3 bg-[#fbfbfd] rounded-xl text-xs">
                  <span className="text-[#86868b] flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Room Number
                  </span>
                  <span className="font-semibold text-[#1d1d1f]">{selectedStudent?.room_number || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-[#fbfbfd] rounded-xl text-xs">
                  <span className="text-[#86868b] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <span className="font-semibold text-[#1d1d1f]">{selectedStudent?.phone || '—'}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-[#fbfbfd] rounded-xl text-xs">
                  <span className="text-[#86868b] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> ID Document
                  </span>
                  <span className="font-semibold text-[#1d1d1f]">{selectedStudent?.id_proof || 'Verified'}</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="pt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#d70015] rounded-full font-semibold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Hostel OS</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Apple Dynamic Bottom Navigation Bar */}
      <div className="fixed bottom-5 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
        <nav className="apple-glass p-1.5 rounded-full flex items-center gap-1 shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-black/[0.08] pointer-events-auto">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === 'home' 
                ? 'bg-[#0071e3] text-white shadow-sm shadow-[#0071e3]/30' 
                : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
            }`}
            title="Meals"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
            {activeTab === 'home' && <span className="animate-in fade-in duration-200">Meals</span>}
          </button>

          <button 
            onClick={() => setActiveTab('fees')} 
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === 'fees' 
                ? 'bg-[#0071e3] text-white shadow-sm shadow-[#0071e3]/30' 
                : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
            }`}
            title="Fees"
          >
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
            {activeTab === 'fees' && <span className="animate-in fade-in duration-200">Fees</span>}
          </button>

          <button 
            onClick={() => setActiveTab('activity')} 
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === 'activity' 
                ? 'bg-[#0071e3] text-white shadow-sm shadow-[#0071e3]/30' 
                : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
            }`}
            title="Activity"
          >
            <Activity className="w-4 h-4 stroke-[2.2]" />
            {activeTab === 'activity' && <span className="animate-in fade-in duration-200">Activity</span>}
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === 'profile' 
                ? 'bg-[#0071e3] text-white shadow-sm shadow-[#0071e3]/30' 
                : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
            }`}
            title="Profile"
          >
            <User className="w-4 h-4 stroke-[2.2]" />
            {activeTab === 'profile' && <span className="animate-in fade-in duration-200">Profile</span>}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default StudentPortal;
