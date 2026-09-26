import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Edit2, Users, Phone, Mail, Home, Calendar, X, Eye } from 'lucide-react';
import Modal from '../components/common/Modal';
import StudentForm from '../components/students/StudentForm';
import StudentDetailsModal from '../components/students/StudentDetailsModal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (student = null) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleViewStudent = (student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingStudent(null);
  };

  const handleSaveStudent = async (formData) => {
    setSaving(true);
    
    const payload = {
      ...formData,
      fee_due_date: formData.fee_due_date || null,
      fee_amount: parseFloat(formData.fee_amount) || 0,
    };

    if (selectedStudent) {
      // Update
      const { error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', selectedStudent.id);
      
      if (!error) {
        setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...payload } : s));
        handleCloseModal();
      } else {
        console.error('Error updating student:', error);
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('students')
        .insert([payload])
        .select();
        
      if (!error && data) {
        setStudents([...students, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
        handleCloseModal();
      } else {
        console.error('Error adding student:', error);
      }
    }
    setSaving(false);
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.phone && student.phone.includes(searchQuery)) ||
      (student.room_number && student.room_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Directory</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">Students</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition-all duration-200 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="apple-card bg-white overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-[#fbfbfd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone or room..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white text-[#1d1d1f] placeholder:text-[#a1a1a6] text-xs sm:text-sm rounded-lg border border-black/[0.08] focus:border-[#0071e3] outline-none transition-all duration-200 focus:ring-4 focus:ring-[#0071e3]/10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] hover:text-[#1d1d1f] rounded-md flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-[#86868b] font-medium self-end sm:self-auto">
            Showing <span className="text-[#1d1d1f] font-semibold">{filteredStudents.length}</span> of {students.length} students
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Student</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Room</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Monthly Fee</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Next Due</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-xs text-[#86868b]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                      <span>Loading students directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] flex items-center justify-center text-[#86868b]">
                        <Users className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-semibold text-[#1d1d1f]">No students found</p>
                      <p className="text-xs text-[#86868b]">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-black/[0.015] transition-colors group">
                    {/* Name & Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.06] font-semibold text-xs flex items-center justify-center shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1d1d1f]">{student.name}</div>
                          <div className="text-xs text-[#86868b]">{student.email || 'No email registered'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] border border-black/[0.04]">
                        {student.room_number ? `Room ${student.room_number}` : 'Unassigned'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 text-xs text-[#515154] font-medium">
                      {student.phone || '—'}
                    </td>

                    {/* Monthly Fee */}
                    <td className="px-6 py-4 text-sm font-semibold text-[#1d1d1f]">
                      ₹{student.fee_amount?.toLocaleString() || '0'}
                    </td>

                    {/* Next Due Date */}
                    <td className="px-6 py-4 text-xs text-[#515154] font-medium">
                      {student.fee_due_date ? format(parseISO(student.fee_due_date), 'dd MMM yyyy') : '—'}
                    </td>

                    {/* Status Pill */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-[#34c759]/10 text-[#248a3d] border border-[#34c759]/20' 
                          : 'bg-[#ff3b30]/10 text-[#d70015] border border-[#ff3b30]/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
                        {student.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewStudent(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] bg-[#f5f5f7] hover:bg-black/[0.06] rounded-lg transition-all duration-200 active:scale-95 border border-black/[0.04]"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#86868b]" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenModal(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0071e3] hover:text-white bg-[#0071e3]/10 hover:bg-[#0071e3] rounded-lg transition-all duration-200 active:scale-95"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Details Modal */}
      <StudentDetailsModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        student={viewingStudent}
        onEdit={(student) => {
          handleCloseViewModal();
          handleOpenModal(student);
        }}
      />

      {/* Edit / Add Student Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={selectedStudent ? "Edit Student Details" : "New Student Registration"}
      >
        <StudentForm 
          initialData={selectedStudent} 
          onSubmit={handleSaveStudent} 
          onCancel={handleCloseModal}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default Students;
