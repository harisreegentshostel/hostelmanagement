import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { format, parseISO, isPast, isToday, addMonths } from 'date-fns';
import { CreditCard, CheckCircle2, Clock, AlertCircle, MessageCircle, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import Modal from '../components/common/Modal';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('status'); // 'status' or 'history'
  const [filter, setFilter] = useState('all'); // 'all', 'due_today', 'overdue', 'paid'
  
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    next_due_date: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'status') {
      fetchStudents();
    } else {
      fetchPayments();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });
      
    if (!error && data) {
      const studentsWithStatus = data.map(student => {
        let status = 'paid';
        if (!student.fee_due_date) {
          status = 'overdue';
        } else {
          const dueDate = parseISO(student.fee_due_date);
          if (isToday(dueDate)) {
            status = 'due_today';
          } else if (isPast(dueDate)) {
            status = 'overdue';
          }
        }
        return { ...student, payment_status: status };
      });
      setStudents(studentsWithStatus);
    }
    setLoading(false);
  };

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(name)')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPayments(data);
    }
    setLoading(false);
  };

  const handleOpenPaymentModal = (student) => {
    setSelectedStudent(student);
    
    let nextDue = new Date();
    if (student.fee_due_date) {
      nextDue = addMonths(parseISO(student.fee_due_date), 1);
    } else {
      nextDue = addMonths(new Date(), 1);
    }
    
    setPaymentForm({
      amount: student.fee_amount || '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      next_due_date: format(nextDue, 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([{
        student_id: selectedStudent.id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        status: 'completed'
      }]);
      
    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      setSaving(false);
      return;
    }

    if (paymentForm.next_due_date) {
      await supabase
        .from('students')
        .update({ fee_due_date: paymentForm.next_due_date })
        .eq('id', selectedStudent.id);
    }

    setIsModalOpen(false);
    setSaving(false);
    
    if (activeTab === 'status') {
      fetchStudents();
    }
  };

  const filteredStudents = useMemo(() => {
    if (filter === 'all') return students;
    return students.filter(s => s.payment_status === filter);
  }, [students, filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Financial Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">Payments & Fees</h1>
        </div>

        {/* Apple Segmented Control */}
        <div className="inline-flex p-1 bg-[#e8e8ed] rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'status' 
                ? 'bg-white text-[#1d1d1f] shadow-sm' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Fee Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'history' 
                ? 'bg-white text-[#1d1d1f] shadow-sm' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {activeTab === 'status' && (
        <div className="apple-card bg-white overflow-hidden">
          {/* Filter Pills */}
          <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-[#fbfbfd] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-[#1d1d1f] text-white shadow-sm' 
                    : 'bg-[#f5f5f7] text-[#515154] hover:bg-[#e8e8ed]'
                }`}
              >
                All ({students.length})
              </button>
              <button 
                onClick={() => setFilter('due_today')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === 'due_today' 
                    ? 'bg-[#5856d6] text-white shadow-sm' 
                    : 'bg-[#5856d6]/10 text-[#5856d6] hover:bg-[#5856d6]/20'
                }`}
              >
                Due Today ({students.filter(s => s.payment_status === 'due_today').length})
              </button>
              <button 
                onClick={() => setFilter('overdue')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === 'overdue' 
                    ? 'bg-[#ff3b30] text-white shadow-sm' 
                    : 'bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/20'
                }`}
              >
                Overdue ({students.filter(s => s.payment_status === 'overdue').length})
              </button>
              <button 
                onClick={() => setFilter('paid')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === 'paid' 
                    ? 'bg-[#34c759] text-white shadow-sm' 
                    : 'bg-[#34c759]/10 text-[#248a3d] hover:bg-[#34c759]/20'
                }`}
              >
                Up to Date ({students.filter(s => s.payment_status === 'paid').length})
              </button>
            </div>

            <span className="text-xs text-[#86868b] font-medium">
              {filteredStudents.length} entries
            </span>
          </div>

          {/* Fee Status Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Monthly Fee</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Next Due Date</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-xs text-[#86868b]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                        <span>Checking fee statuses...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-xs text-[#86868b]">
                      No student records match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#1d1d1f]">{student.name}</div>
                        <div className="text-xs text-[#86868b]">Room {student.room_number || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#1d1d1f]">
                        ₹{student.fee_amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#515154]">
                        {student.fee_due_date ? format(parseISO(student.fee_due_date), 'dd MMM yyyy') : 'Not Set'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          student.payment_status === 'paid' 
                            ? 'bg-[#34c759]/10 text-[#248a3d] border border-[#34c759]/20' 
                            : student.payment_status === 'due_today' 
                            ? 'bg-[#5856d6]/10 text-[#5856d6] border border-[#5856d6]/20' 
                            : 'bg-[#ff3b30]/10 text-[#d70015] border border-[#ff3b30]/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            student.payment_status === 'paid' 
                              ? 'bg-[#34c759]' 
                              : student.payment_status === 'due_today' 
                              ? 'bg-[#5856d6]' 
                              : 'bg-[#ff3b30]'
                          }`} />
                          {student.payment_status === 'paid' ? 'Paid' : student.payment_status === 'due_today' ? 'Due Today' : 'Overdue'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(student.payment_status === 'due_today' || student.payment_status === 'overdue') ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button 
                              onClick={() => handleOpenPaymentModal(student)}
                              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm transition-all duration-200 active:scale-95"
                            >
                              Record Payment
                            </button>
                            {student.phone && (
                              <a 
                                href={`https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                   `Hello ${student.name},\n\nThis is a gentle reminder from the hostel administration. Your fee of ₹${student.fee_amount} was due on ${student.fee_due_date ? format(parseISO(student.fee_due_date), 'dd MMM yyyy') : 'an earlier date'}. Please clear your dues as soon as possible. Thank you!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#248a3d] bg-[#34c759]/15 hover:bg-[#34c759]/25 rounded-lg transition-all duration-200 active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#86868b] font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                            All Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="apple-card bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-[#fbfbfd] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Transaction Ledger</span>
            <span className="text-xs text-[#86868b] font-medium">{payments.length} transactions recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-xs text-[#86868b]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                        <span>Loading payment receipts...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-xs text-[#86868b]">
                      No recorded payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-[#515154]">
                        {format(parseISO(payment.created_at || payment.payment_date), 'dd MMM yyyy, hh:mm a')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#1d1d1f]">
                        {payment.students?.name || 'Unknown Student'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#1d1d1f]">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#34c759]/10 text-[#248a3d] border border-[#34c759]/20 rounded-md text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3 text-[#34c759]" />
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Sheet Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Record Payment • ${selectedStudent?.name}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Amount Paid (₹) *</label>
            <input 
              type="number" 
              required
              min="1"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10 font-semibold"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Payment Date *</label>
            <input 
              type="date" 
              required
              value={paymentForm.payment_date}
              onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-lg border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1d1d1f]">Advance Next Due Date To:</label>
              <span className="text-[10px] uppercase font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">Next Cycle</span>
            </div>
            <p className="text-[11px] text-[#86868b]">
              Automatically shifted 1 month forward. You can adjust if needed.
            </p>
            <input 
              type="date" 
              required
              value={paymentForm.next_due_date}
              onChange={e => setPaymentForm({...paymentForm, next_due_date: e.target.value})}
              className="w-full px-3.5 py-2 bg-white text-[#1d1d1f] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
