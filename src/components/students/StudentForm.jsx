import React, { useState, useEffect } from 'react';

const StudentForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    id_proof: '',
    room_number: '',
    fee_amount: 0,
    fee_due_date: '',
    status: 'active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        id_proof: initialData.id_proof || '',
        room_number: initialData.room_number || '',
        fee_amount: initialData.fee_amount || 0,
        fee_due_date: initialData.fee_due_date || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Personal Details */}
      <div className="space-y-4">
        <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
          Student Information
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. John Appleseed"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Email Address *</label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. john@icloud.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">ID Proof (e.g., Aadhaar / Passport)</label>
            <input
              type="text"
              name="id_proof"
              placeholder="ID number or details"
              value={formData.id_proof}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
        </div>
      </div>

      {/* Hostel & Fee Details */}
      <div className="pt-2 space-y-4">
        <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
          Room & Billing
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Room Number</label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={handleChange}
              placeholder="e.g. 204"
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Account Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Monthly Fee (₹) *</label>
            <input
              type="number"
              name="fee_amount"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.fee_amount}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#1d1d1f]">Next Fee Due Date</label>
            <input
              type="date"
              name="fee_due_date"
              value={formData.fee_due_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] text-sm border border-black/[0.08] focus:border-[#0071e3] rounded-lg outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all duration-200 active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Student'
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
