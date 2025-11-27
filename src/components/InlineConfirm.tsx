import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface InlineConfirmProps {
  /** The trigger button/element */
  trigger: ReactNode;
  /** Message to show when expanded */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant affects the confirm button color */
  variant?: 'danger' | 'warning' | 'info';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Optional: called when user cancels */
  onCancel?: () => void;
  /** Whether the confirm is currently expanded */
  isOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * InlineConfirm Component
 * Expands inline to show confirmation instead of a modal popup
 */
export function InlineConfirm({
  trigger,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isOpen: controlledIsOpen,
  onOpenChange,
}: InlineConfirmProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  // Use refs to hold callback references to avoid re-running effects
  const setIsOpenRef = useRef(setIsOpen);
  const onCancelRef = useRef(onCancel);
  setIsOpenRef.current = setIsOpen;
  onCancelRef.current = onCancel;

  const variantStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  // Stable close handler
  const closeAndCancel = useCallback(() => {
    setIsOpenRef.current(false);
    onCancelRef.current?.();
  }, []);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAndCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeAndCancel]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAndCancel();
      }
    };

    // Small delay to prevent immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, closeAndCancel]);

  const handleTriggerClick = () => {
    setIsOpen(true);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  if (!isOpen) {
    return (
      <div onClick={handleTriggerClick} className="inline-flex">
        {trigger}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0 truncate">
          {message}
        </span>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-200 dark:border-slate-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-2.5 py-1 text-xs font-medium text-white rounded transition-colors focus:outline-none focus:ring-2 ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing inline confirm state
 * Useful when you need to track which item is being confirmed in a list
 */
export function useInlineConfirm<T = string | number>() {
  const [confirmingId, setConfirmingId] = useState<T | null>(null);

  const startConfirm = (id: T) => setConfirmingId(id);
  const cancelConfirm = () => setConfirmingId(null);
  const isConfirming = (id: T) => confirmingId === id;

  return {
    confirmingId,
    startConfirm,
    cancelConfirm,
    isConfirming,
  };
}
