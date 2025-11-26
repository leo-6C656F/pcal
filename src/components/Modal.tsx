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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in-0 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors -mt-1 -mr-1"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
