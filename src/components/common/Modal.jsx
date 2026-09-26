import React, { useEffect } from 'react';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Apple-style backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Apple Sheet Window */}
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col bg-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border border-black/[0.08] overflow-hidden z-10 my-auto transition-all duration-300 animate-in zoom-in-95 fade-in">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-black/[0.06] bg-[#fbfbfd]/90 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#1d1d1f] flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
