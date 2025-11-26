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
    <Modal title={t('pdfExport.finalizeRequired')} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {t('pdfExport.signatureRequired')}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {t('pdfExport.signatureRequiredDescription')}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-600 font-medium mb-3">
            {t('pdfExport.entriesNeedingFinalization')}:
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {unsignedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50/30"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                    {!entry.signatureBase64 && (
                      <span className="text-amber-700 font-medium"> • {t('common.notSigned')}</span>
                    )}
                  </p>
                </div>

                {entry.signatureBase64 ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle size={16} />
                    <span className="text-sm font-semibold">{t('common.signed')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFinalizeEntry(entry)}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <Edit3 size={16} />
                    {t('pdfExport.finalize')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center italic">
            {t('pdfExport.finalizeAllToGenerate')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
