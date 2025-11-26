import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { format, parse } from 'date-fns';
import { AlertCircle, Edit3, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import type { DailyEntry } from '../types';

interface FinalizeEntriesModalProps {
  onClose: () => void;
  unsignedEntries: DailyEntry[];
  onProceed: () => void;
}

export function FinalizeEntriesModal({ onClose, unsignedEntries, onProceed }: FinalizeEntriesModalProps) {
  const { t } = useTranslation();
  const { setCurrentEntry } = useStore();

  const handleFinalizeEntry = (entry: DailyEntry) => {
    setCurrentEntry(entry);
    onClose(); // Close the export modal to navigate to the entry
  };

  // Check if all entries are now signed (in case user comes back)
  const allSigned = unsignedEntries.every(entry => entry.signatureBase64);

  if (allSigned) {
    // All entries are signed, allow proceeding to PDF generation
    onProceed();
    return null;
  }

  return (
    <Modal
      title={t('pdfExport.finalizeRequired')}
      onClose={onClose}
      size="lg"
      footer={
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
          {t('pdfExport.finalizeAllToGenerate')}
        </p>
      }
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              {t('pdfExport.signatureRequired')}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {t('pdfExport.signatureRequiredDescription')}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">
            {t('pdfExport.entriesNeedingFinalization')}:
          </p>

          <div className="space-y-1.5">
            {unsignedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-xs">
                    {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                    {!entry.signatureBase64 && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium"> • {t('common.notSigned')}</span>
                    )}
                  </p>
                </div>

                {entry.signatureBase64 ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg flex-shrink-0">
                    <CheckCircle size={12} />
                    <span className="text-[11px] font-semibold">{t('common.signed')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFinalizeEntry(entry)}
                    className="btn-primary flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1"
                  >
                    <Edit3 size={12} />
                    {t('pdfExport.finalize')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
