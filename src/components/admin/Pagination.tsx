import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'items',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`bg-white rounded-2xl border border-black/[0.06] p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 select-none ${className}`}
    >
      {/* Item Range Count */}
      <div className="text-xs text-[#86868b] font-medium text-center sm:text-left">
        Showing{' '}
        <span className="font-semibold text-[#1d1d1f] font-mono">
          {startItem}
        </span>
        –
        <span className="font-semibold text-[#1d1d1f] font-mono">{endItem}</span>{' '}
        of{' '}
        <span className="font-semibold text-[#1d1d1f] font-mono">
          {totalItems}
        </span>{' '}
        {itemName}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="First page"
            aria-label="First page"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer active:scale-95"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous page"
            aria-label="Previous page"
            className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 h-8 rounded-xl text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Mobile Current Page Indicator */}
          <div className="sm:hidden flex items-center gap-1 px-2.5 py-1 bg-[#f5f5f7] rounded-xl border border-black/[0.06] text-xs font-semibold text-[#1d1d1f]">
            <span>Page</span>
            <span className="font-mono text-[#011627] font-bold">
              {currentPage}
            </span>
            <span className="text-[#86868b]">/</span>
            <span className="font-mono text-[#86868b]">{totalPages}</span>
          </div>

          {/* Desktop Page Numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-[#86868b] font-medium"
                  >
                    …
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center ${
                    isActive
                      ? 'bg-[#011627] text-white shadow-xs'
                      : 'text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Next page"
            aria-label="Next page"
            className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 h-8 rounded-xl text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer active:scale-95"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last page"
            aria-label="Last page"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer active:scale-95"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
