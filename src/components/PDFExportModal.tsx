import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { format, parse } from 'date-fns';
import { Mail, FileText, ArrowLeft, AlertCircle, Edit3, CheckCircle, X } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import type { DailyEntry } from '../types';

type View = 'select' | 'finalize' | 'preview';

interface PDFExportModalProps {
  onClose: () => void;
  childEntries: DailyEntry[];
}

export function PDFExportModal({ onClose, childEntries }: PDFExportModalProps) {
  const { t } = useTranslation();
  const { goals, currentChild, setCurrentEntry } = useStore();
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('select');

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
    const unsignedEntries = selectedEntries.filter(e => !e.signatureBase64);
    if (unsignedEntries.length > 0) {
      setView('finalize');
    } else {
      setView('preview');
    }
  };

  const handleFinalizeEntry = (entry: DailyEntry) => {
    setCurrentEntry(entry);
    onClose();
  };

  const selectedEntries = childEntries.filter(e => selectedEntryIds.has(e.id)).sort((a, b) => a.date.localeCompare(b.date));
  const unsignedEntries = selectedEntries.filter(e => !e.signatureBase64);

  // Check if all entries are now signed
  if (view === 'finalize' && unsignedEntries.length === 0) {
    setView('preview');
  }

  // Full-screen container
  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 animate-fade-in overflow-y-auto">
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {view !== 'select' && (
                  <button
                    onClick={() => setView(view === 'preview' ? (unsignedEntries.length > 0 ? 'finalize' : 'select') : 'select')}
                    className="p-2 text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    aria-label={t('common.back')}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {view === 'select' && t('pdfExport.title')}
                      {view === 'finalize' && t('pdfExport.finalizeRequired')}
                      {view === 'preview' && t('pdfExport.pdfPreview')}
                    </h1>
                    {view === 'preview' && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedEntries.length} {selectedEntries.length === 1 ? t('common.entry') : t('common.entriesPlural')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Selection View */}
          {view === 'select' && (
            <>
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('pdfExport.selectEntries')}</p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-primary hover:text-primary/90 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                  >
                    {selectedEntryIds.size === childEntries.length ? t('common.deselectAll') : t('common.selectAll')}
                  </button>
                </div>

                <div className="space-y-2">
                  {childEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedEntryIds.has(entry.id)
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                          : entry.emailedAt
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntryIds.has(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
                          </p>
                          {entry.emailedAt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700">
                              <Mail size={10} />
                              {t('common.sent')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                          {entry.signatureBase64 && <span className="text-emerald-600 dark:text-emerald-400"> • ✓ {t('common.signed')}</span>}
                          {entry.emailedAt && ` • ${format(new Date(entry.emailedAt), 'MMM d, h:mm a')}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
                {selectedEntryIds.size > 0 ? (
                  <button
                    onClick={handleGeneratePDF}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
                  >
                    <FileText size={20} />
                    {t('pdfExport.reviewGenerate')} ({selectedEntryIds.size})
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-3">
                    {t('pdfExport.selectAtLeastOne')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Finalize View */}
          {view === 'finalize' && (
            <>
              <div className="card p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      {t('pdfExport.signatureRequired')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {t('pdfExport.signatureRequiredDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">
                  {t('pdfExport.entriesNeedingFinalization')}:
                </p>

                <div className="space-y-2">
                  {unsignedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                          <span className="text-amber-700 dark:text-amber-400 font-medium"> • {t('common.notSigned')}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleFinalizeEntry(entry)}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                      >
                        <Edit3 size={16} />
                        {t('pdfExport.finalize')}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Signed entries */}
                {selectedEntries.filter(e => e.signatureBase64).length > 0 && (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-6 mb-4">
                      {t('common.signed')}:
                    </p>
                    <div className="space-y-2">
                      {selectedEntries.filter(e => e.signatureBase64).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg">
                            <CheckCircle size={16} />
                            <span className="text-sm font-semibold">{t('common.signed')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Action area */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {t('pdfExport.finalizeAllToGenerate')}
                </p>
              </div>
            </>
          )}

          {/* Preview View */}
          {view === 'preview' && currentChild && (
            <div className="card p-6">
              <PDFPreview
                entries={selectedEntries}
                child={currentChild}
                centerName={currentChild.center}
                teacherName={currentChild.teacher}
                goals={goals}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
