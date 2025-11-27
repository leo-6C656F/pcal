import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { format, parse } from 'date-fns';
import { Mail, FileText, ArrowLeft, AlertCircle, Edit3, CheckCircle, Home } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import type { DailyEntry } from '../types';
import { useNavigate } from 'react-router-dom';

type View = 'select' | 'finalize' | 'preview';

export function PDFExportPage() {
  const { t } = useTranslation();
  const { goals, currentChild, setCurrentEntry, entries } = useStore();
  const childEntries = useMemo(() => {
    if (!currentChild) return [];
    return entries
      .filter((e: DailyEntry) => e.childId === currentChild.id)
      .sort((a: DailyEntry, b: DailyEntry) => b.date.localeCompare(a.date));
  }, [entries, currentChild]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('select');
  const navigate = useNavigate();

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
      setSelectedEntryIds(new Set(childEntries.map((e: DailyEntry) => e.id)));
    }
  };

  const handleGeneratePDF = () => {
    const unsignedEntries = selectedEntries.filter((e: DailyEntry) => !e.signatureBase64);
    if (unsignedEntries.length > 0) {
      setView('finalize');
    } else {
      setView('preview');
    }
  };

  const handleFinalizeEntry = (entry: DailyEntry) => {
    setCurrentEntry(entry);
    navigate('/');
  };

  const selectedEntries = childEntries.filter((e: DailyEntry) => selectedEntryIds.has(e.id)).sort((a: DailyEntry, b: DailyEntry) => a.date.localeCompare(b.date));
  const unsignedEntries = selectedEntries.filter((e: DailyEntry) => !e.signatureBase64);

  // Check if all entries are now signed
  if (view === 'finalize' && unsignedEntries.length === 0) {
    setView('preview');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
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
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              aria-label={t('common.backToHome')}
            >
              <Home size={18} />
              <span className="hidden sm:inline">{t('common.dashboard')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection View */}
            {view === 'select' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">{t('pdfExport.selectEntries')}</p>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-primary hover:text-primary/90 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                    >
                      {selectedEntryIds.size === childEntries.length ? t('common.deselectAll') : t('common.selectAll')}
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {childEntries.map((entry: DailyEntry) => (
                    <label
                      key={entry.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedEntryIds.has(entry.id)
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/30'
                          : entry.emailedAt
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
                          : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntryIds.has(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
                        className="w-5 h-5 text-primary rounded-md focus:ring-primary mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">
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
                          {entry.signatureBase64 ? <span className="text-emerald-600 dark:text-emerald-400"> • ✓ {t('common.signed')}</span> : <span className="text-amber-600 dark:text-amber-400"> • {t('common.notSigned')}</span>}
                          {entry.emailedAt && ` • ${format(new Date(entry.emailedAt), 'MMM d, h:mm a')}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Finalize View */}
            {view === 'finalize' && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                  <p className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    {t('pdfExport.entriesNeedingFinalization')}:
                  </p>

                  <div className="space-y-3">
                    {unsignedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
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
                      <p className="text-lg font-semibold text-slate-800 dark:text-white mt-8 mb-4">
                        {t('common.readyForExport')}
                      </p>
                      <div className="space-y-3">
                        {selectedEntries.filter(e => e.signatureBase64).map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {entry.lines.length} {entry.lines.length === 1 ? t('common.activity') : t('common.activitiesPlural')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle size={20} />
                              <span className="text-sm font-semibold">{t('common.signed')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Preview View */}
            {view === 'preview' && currentChild && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <PDFPreview
                  entries={selectedEntries}
                  child={currentChild}
                  centerName={currentChild.center}
                  teacherName={currentChild.teacher}
                  goals={goals}
                  onClose={() => setView('select')}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            {/* Summary Card */}
            {view === 'select' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('common.summary')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>{t('pdfExport.selectedForExport')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedEntryIds.size}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>{t('common.totalEntries')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{childEntries.length}</span>
                  </div>
                </div>
                {selectedEntryIds.size > 0 ? (
                  <button
                    onClick={handleGeneratePDF}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-6"
                  >
                    <FileText size={20} />
                    {t('pdfExport.reviewGenerate')} ({selectedEntryIds.size})
                  </button>
                ) : (
                  <div className="text-center mt-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('pdfExport.selectAtLeastOne')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {view === 'finalize' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={28} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t('pdfExport.signatureRequired')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {t('pdfExport.finalizeAllToGenerate')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}