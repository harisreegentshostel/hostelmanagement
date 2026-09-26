import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { format, parseISO } from 'date-fns';
import { Coffee, Sun, Moon, Check, X, Calendar, UtensilsCrossed, Clock } from 'lucide-react';

const FoodManagement = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregates
  const [totals, setTotals] = useState({ breakfast: 0, lunch: 0, dinner: 0 });

  useEffect(() => {
    fetchMealRequests();
  }, [date]);

  const fetchMealRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meal_requests')
      .select(`
        *,
        students(name, room_number, phone, id_proof)
      `)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal requests:', error);
    } else {
      setRequests(data || []);
      
      let b = 0, l = 0, d = 0;
      (data || []).forEach(req => {
        if (req.breakfast) b++;
        if (req.lunch) l++;
        if (req.dinner) d++;
      });
      setTotals({ breakfast: b, lunch: l, dinner: d });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Kitchen Operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">Food Requests</h1>
        </div>
        
        {/* Apple Date Picker Bar */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-black/[0.08] shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-[#86868b]" />
          <label className="text-xs font-medium text-[#86868b]">Date:</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-[#1d1d1f] outline-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Breakfast Card */}
        <div className="apple-card p-5 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center shrink-0">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Breakfast</p>
              <h3 className="text-2xl font-bold text-[#1d1d1f] mt-0.5">{loading ? '-' : totals.breakfast}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-md">
            Morning
          </span>
        </div>

        {/* Lunch Card */}
        <div className="apple-card p-5 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Lunch</p>
              <h3 className="text-2xl font-bold text-[#1d1d1f] mt-0.5">{loading ? '-' : totals.lunch}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-md">
            Afternoon
          </span>
        </div>

        {/* Dinner Card */}
        <div className="apple-card p-5 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#5856d6]/10 text-[#5856d6] flex items-center justify-center shrink-0">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Dinner</p>
              <h3 className="text-2xl font-bold text-[#1d1d1f] mt-0.5">{loading ? '-' : totals.dinner}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-md">
            Evening
          </span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="apple-card bg-white overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-[#fbfbfd] flex items-center justify-between">
          <div className="text-xs text-[#86868b] font-medium">
            Meal roster for <span className="text-[#1d1d1f] font-semibold">{format(parseISO(date), 'EEEE, dd MMMM yyyy')}</span>
          </div>
          <span className="text-xs font-medium text-[#86868b]">{requests.length} students responded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Student</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Room</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-center">Breakfast</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-center">Lunch</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-center">Dinner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-xs text-[#86868b]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                      <span>Loading kitchen requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] flex items-center justify-center text-[#86868b]">
                        <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-semibold text-[#1d1d1f]">No food requests</p>
                      <p className="text-xs text-[#86868b]">No meal preferences logged for this date yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#1d1d1f]">{req.students?.name || 'Unknown Resident'}</div>
                      <div className="text-xs text-[#86868b]">{req.students?.id_proof || 'No ID on file'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f]">
                        {req.students?.room_number ? `Room ${req.students.room_number}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#515154] font-medium">
                      {req.students?.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#86868b]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#a1a1a6]" />
                        {req.created_at ? format(parseISO(req.created_at), 'hh:mm a') : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.breakfast ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#34c759]/15 text-[#34c759]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#f5f5f7] text-[#a1a1a6]">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.lunch ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#34c759]/15 text-[#34c759]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#f5f5f7] text-[#a1a1a6]">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.dinner ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#34c759]/15 text-[#34c759]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#f5f5f7] text-[#a1a1a6]">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FoodManagement;
