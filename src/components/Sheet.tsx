import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  children: ReactNode;
  onClose: () => void;
  title: string | ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

/**
 * Sheet Component - Slide-in panel from the right
 * Replaces traditional modal dialogs for a less intrusive UX
 */
export function Sheet({ children, onClose, title, size = 'md', footer }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'max-w-sm',      // 384px
    md: 'max-w-lg',      // 512px
    lg: 'max-w-2xl',     // 672px
  };

  useEffect(() => {
    // Focus the content area for immediate scrolling, then close button for accessibility
    if (contentRef.current) {
      contentRef.current.focus();
    }

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !sheetRef.current) return;

      const focusableElements = sheetRef.current.querySelectorAll(
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
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        ref={sheetRef}
        className={`fixed inset-y-0 right-0 w-full ${sizeClasses[size]} bg-white dark:bg-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex justify-between items-center gap-3">
            {typeof title === 'string' ? (
              <h2 id="sheet-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            ) : (
              <div id="sheet-title" className="flex-1 min-w-0">
                {title}
              </div>
            )}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          tabIndex={-1}
          className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-6 py-4 focus:outline-none"
        >
          {children}
        </div>

        {/* Footer (if provided) */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
