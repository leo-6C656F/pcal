import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ children, onClose, title, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 dark:from-black/70 dark:via-black/60 dark:to-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in-0 duration-200 p-4 sm:p-6 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-slate-700/60 w-full ${sizeClasses[size]} max-h-[85vh] sm:max-h-[88vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/30">
          <div className="flex justify-between items-start gap-4">
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Close modal"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-7">
          {children}
        </div>
      </div>
    </div>
  );
}
