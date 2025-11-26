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
        className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 dark:from-black/70 dark:via-black/60 dark:to-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-700/50 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 overflow-hidden overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-t-[28px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                  aria-label={t('pdfExport.backToSelection')}
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{t('pdfExport.pdfPreview')}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {t('pdfExport.entriesSelected', { count: selectedEntries.length, type: selectedEntries.length === 1 ? t('common.entry') : t('common.entriesPlural') })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto scroll-smooth p-6">
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
    <Modal title={t('pdfExport.title')} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('pdfExport.selectEntries')}</p>
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary hover:text-primary/90 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded px-2 py-1"
            >
              {selectedEntryIds.size === childEntries.length ? t('common.deselectAll') : t('common.selectAll')}
            </button>
          </div>

          <div className="space-y-2">
            {childEntries.map((entry) => (
              <label
                key={entry.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                  entry.emailedAt
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50'
                } cursor-pointer`}
              >
                <input
                  type="checkbox"
                  checked={selectedEntryIds.has(entry.id)}
                  onChange={() => toggleEntrySelection(entry.id)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                    </p>
                    {entry.emailedAt && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700 flex-shrink-0">
                        <Mail size={11} />
                        {t('common.sent')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                    {entry.signatureBase64 && ` • ${t('common.signed')}`}
                    {entry.emailedAt && (
                      <>
                        {' • '}
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {t('common.sent')} {format(new Date(entry.emailedAt), 'MMM d, h:mm a')}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedEntryIds.size > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <FileText size={16} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('pdfExport.entriesSelected', { count: selectedEntryIds.size, type: selectedEntryIds.size === 1 ? t('common.entry') : t('common.entriesPlural') })}
                </p>
              </div>
            </div>
            <button
              onClick={handleGeneratePDF}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              {t('pdfExport.reviewGenerate')}
            </button>
          </div>
        )}

        {selectedEntryIds.size === 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center italic">
              {t('pdfExport.selectAtLeastOne')}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
