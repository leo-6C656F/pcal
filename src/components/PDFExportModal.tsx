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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                aria-label={t('pdfExport.backToSelection')}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-primary sm:hidden" />
                <FileText size={20} className="text-primary hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{t('pdfExport.pdfPreview')}</h2>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  {t('pdfExport.entriesSelected', { count: selectedEntries.length, type: selectedEntries.length === 1 ? t('common.entry') : t('common.entriesPlural') })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
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
      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-600 font-medium">{t('pdfExport.selectEntries')}</p>
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary hover:text-primary/90 font-semibold transition-colors"
            >
              {selectedEntryIds.size === childEntries.length ? t('common.deselectAll') : t('common.selectAll')}
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {childEntries.map((entry) => (
              <label
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  entry.emailedAt
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                    : 'border-slate-200 hover:bg-slate-50'
                } cursor-pointer`}
              >
                <input
                  type="checkbox"
                  checked={selectedEntryIds.has(entry.id)}
                  onChange={() => toggleEntrySelection(entry.id)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                    </p>
                    {entry.emailedAt && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        <Mail size={12} />
                        {t('common.sent')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                    {entry.signatureBase64 && ` • ${t('common.signed')}`}
                    {entry.emailedAt && (
                      <>
                        {' • '}
                        <span className="text-emerald-700 font-medium">
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
          <div className="pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText size={16} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
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
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center italic">
              {t('pdfExport.selectAtLeastOne')}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
