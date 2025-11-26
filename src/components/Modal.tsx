import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

export function Modal({ children, onClose, title, size = 'md', footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Compact sizes - more screen space efficient
  const sizeClasses = {
    sm: 'max-w-[320px]',  // Simple dialogs
    md: 'max-w-[480px]',  // Standard dialogs
    lg: 'max-w-[640px]',  // Wide dialogs
  };

  // Focus trap and keyboard navigation
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 dark:from-black/70 dark:via-black/60 dark:to-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in-0 duration-200 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full ${sizeClasses[size]} max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex justify-between items-center gap-3">
            <h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close modal"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-4 py-3">
          {children}
        </div>

        {/* Sticky Footer (if provided) */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky bottom-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
