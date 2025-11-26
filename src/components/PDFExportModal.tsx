import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { format, parse } from 'date-fns';
import { Mail, FileText, X, ArrowLeft } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import { Modal } from './Modal';
import { FinalizeEntriesModal } from './FinalizeEntriesModal';
import type { DailyEntry } from '../types';

interface PDFExportModalProps {
  onClose: () => void;
  childEntries: DailyEntry[];
}

export function PDFExportModal({ onClose, childEntries }: PDFExportModalProps) {
  const { t } = useTranslation();
  const { goals, currentChild } = useStore();
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [showFinalization, setShowFinalization] = useState(false);

  const toggleEntrySelection = (entryId: string) => {
    const newSelection = new Set(selectedEntryIds);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntryIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEntryIds.size === childEntries.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(childEntries.map(e => e.id)));
    }
  };

  const handleGeneratePDF = () => {
    // Check if all selected entries have signatures
    const unsignedEntries = selectedEntries.filter(e => !e.signatureBase64);

    if (unsignedEntries.length > 0) {
      // Show finalization modal if there are unsigned entries
      setShowFinalization(true);
    } else {
      // All entries are signed, proceed to preview
      setShowPreview(true);
    }
  };

  const handleProceedToPreview = () => {
    setShowFinalization(false);
    setShowPreview(true);
  };

  const selectedEntries = childEntries.filter(e => selectedEntryIds.has(e.id)).sort((a, b) => a.date.localeCompare(b.date));
  const unsignedEntries = selectedEntries.filter(e => !e.signatureBase64);

  // Show finalization modal if there are unsigned entries
  if (showFinalization && unsignedEntries.length > 0) {
    return (
      <FinalizeEntriesModal
        onClose={onClose}
        unsignedEntries={unsignedEntries}
        onProceed={handleProceedToPreview}
      />
    );
  }

  if (showPreview && selectedEntryIds.size > 0 && currentChild) {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 dark:from-black/70 dark:via-black/60 dark:to-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in-0"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col animate-in zoom-in-95 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={t('pdfExport.backToSelection')}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">{t('pdfExport.pdfPreview')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {selectedEntries.length} {selectedEntries.length === 1 ? t('common.entry') : t('common.entriesPlural')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-smooth p-4">
            <PDFPreview
              entries={selectedEntries}
              child={currentChild}
              centerName={currentChild.center}
              teacherName={currentChild.teacher}
              goals={goals}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      title={t('pdfExport.title')}
      onClose={onClose}
      size="lg"
      footer={
        selectedEntryIds.size > 0 ? (
          <button
            onClick={handleGeneratePDF}
            className="btn-primary w-full flex items-center justify-center gap-1.5 text-sm py-2"
          >
            <FileText size={16} />
            {t('pdfExport.reviewGenerate')} ({selectedEntryIds.size})
          </button>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
            {t('pdfExport.selectAtLeastOne')}
          </p>
        )
      }
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('pdfExport.selectEntries')}</p>
          <button
            onClick={toggleSelectAll}
            className="text-xs text-primary hover:text-primary/90 font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5"
          >
            {selectedEntryIds.size === childEntries.length ? t('common.deselectAll') : t('common.selectAll')}
          </button>
        </div>

        <div className="space-y-1.5">
          {childEntries.map((entry) => (
            <label
              key={entry.id}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                entry.emailedAt
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50'
              } cursor-pointer`}
            >
              <input
                type="checkbox"
                checked={selectedEntryIds.has(entry.id)}
                onChange={() => toggleEntrySelection(entry.id)}
                className="w-3.5 h-3.5 text-primary rounded focus:ring-primary flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-slate-900 dark:text-white text-xs">
                    {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                  </p>
                  {entry.emailedAt && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700 flex-shrink-0">
                      <Mail size={9} />
                      {t('common.sent')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                  {entry.signatureBase64 && ` • ${t('common.signed')}`}
                  {entry.emailedAt && ` • ${format(new Date(entry.emailedAt), 'MMM d, h:mm a')}`}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
