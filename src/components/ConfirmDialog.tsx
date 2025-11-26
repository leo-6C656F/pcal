import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      button: 'btn-danger',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn-primary flex-1 ${styles.button}`}>
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}>
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
