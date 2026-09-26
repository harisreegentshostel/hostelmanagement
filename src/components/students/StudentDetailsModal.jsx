import React from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { 
  Home, Phone, Calendar, Shield, 
  MessageCircle, Edit2, CreditCard
} from 'lucide-react';
import Modal from '../common/Modal';

const StudentDetailsModal = ({ isOpen, onClose, student, onEdit }) => {
  if (!student) return null;

  // Compute fee status
  let feeStatusLabel = 'Paid & Settled';
  let feeStatusColor = 'bg-[#34c759]/10 text-[#248a3d] border-[#34c759]/20';
  let feeDotColor = 'bg-[#34c759]';

  if (!student.fee_due_date) {
    feeStatusLabel = 'Due Date Not Set';
    feeStatusColor = 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20';
    feeDotColor = 'bg-[#ff9500]';
  } else {
    const dueDate = parseISO(student.fee_due_date);
    if (isToday(dueDate)) {
      feeStatusLabel = 'Due Today';
      feeStatusColor = 'bg-[#5856d6]/10 text-[#5856d6] border-[#5856d6]/20';
      feeDotColor = 'bg-[#5856d6]';
    } else if (isPast(dueDate)) {
      feeStatusLabel = 'Payment Overdue';
      feeStatusColor = 'bg-[#ff3b30]/10 text-[#d70015] border-[#ff3b30]/20';
      feeDotColor = 'bg-[#ff3b30]';
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resident Profile">
      <div className="space-y-5">
        {/* Top Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f5f5f7] rounded-xl border border-black/[0.06]">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white border border-black/[0.08] text-[#1d1d1f] font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
              {student.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1d1d1f]">{student.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  student.status === 'active' 
                    ? 'bg-[#34c759]/10 text-[#248a3d] border-[#34c759]/20' 
                    : 'bg-[#ff3b30]/10 text-[#d70015] border-[#ff3b30]/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
                  {student.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-[#86868b] mt-0.5 break-all">{student.email || 'No email registered'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {student.phone && (
              <a
                href={`https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${student.name}, message from Hostel Admin.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#248a3d] bg-white hover:bg-[#34c759]/10 border border-black/[0.08] rounded-lg transition-all active:scale-95 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] border border-transparent rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Room Number */}
          <div className="p-3.5 bg-white rounded-xl border border-black/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0">
              <Home className="w-4 h-4 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">Assigned Room</p>
              <p className="text-sm font-semibold text-[#1d1d1f] mt-0.5">
                {student.room_number ? `Room ${student.room_number}` : 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="p-3.5 bg-white rounded-xl border border-black/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">Phone Contact</p>
              <p className="text-sm font-semibold text-[#1d1d1f] mt-0.5">
                {student.phone ? (
                  <a href={`tel:${student.phone}`} className="hover:text-[#0071e3] hover:underline">
                    {student.phone}
                  </a>
                ) : 'Not provided'}
              </p>
            </div>
          </div>

          {/* ID Proof */}
          <div className="p-3.5 bg-white rounded-xl border border-black/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">ID Document / Proof</p>
              <p className="text-sm font-semibold text-[#1d1d1f] mt-0.5">
                {student.id_proof || 'No ID document recorded'}
              </p>
            </div>
          </div>

          {/* Member Registration Date */}
          <div className="p-3.5 bg-white rounded-xl border border-black/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">Registered On</p>
              <p className="text-sm font-semibold text-[#1d1d1f] mt-0.5">
                {student.created_at ? format(parseISO(student.created_at), 'dd MMMM yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Financial / Billing Summary Card */}
        <div className="p-4 bg-white rounded-xl border border-black/[0.06] space-y-3">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0071e3]" />
              <span className="text-xs font-semibold text-[#1d1d1f]">Monthly Billing & Dues</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${feeStatusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${feeDotColor}`} />
              {feeStatusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider">Fee Amount</p>
              <p className="text-lg font-bold text-[#1d1d1f] mt-0.5">
                ₹{student.fee_amount?.toLocaleString() || '0'}
                <span className="text-xs font-normal text-[#86868b]"> / month</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider">Next Due Date</p>
              <p className="text-sm font-semibold text-[#1d1d1f] mt-1">
                {student.fee_due_date ? format(parseISO(student.fee_due_date), 'dd MMM yyyy') : 'No due date set'}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-black/[0.06] rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentDetailsModal;
