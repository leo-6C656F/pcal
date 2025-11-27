import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Plus, Calendar, User, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ChildForm } from './ChildForm';
import { ChildList } from './ChildList';
import { EntryList } from './EntryList';
import { Sheet } from './Sheet';
import { WelcomeScreen } from './WelcomeScreen';
import { PullToRefresh } from './PullToRefresh';

/**
 * Dashboard Component
 * Manages children and daily entries
 */
export function Dashboard({ onNavigateToExport }: { onNavigateToExport: () => void }) {
  const { t } = useTranslation();
  const {
    entries,
    children,
    currentChild,
    setCurrentChild,
    setCurrentEntry,
    createEntry,
    loadChildren,
    loadEntries,
  } = useStore();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([loadChildren(), loadEntries()]);
    // Store functions are stable (from Zustand), so we don't need them as dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showChildForm, setShowChildForm] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Check if this is first time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('pcal_welcome_seen');
    if (!hasSeenWelcome && children.length === 0 && entries.length === 0) {
      setShowWelcome(true);
    }
  }, [children.length, entries.length]);

  // Memoize filtered and sorted entries to avoid recalculating on every render
  const childEntries = useMemo(() => {
    if (!currentChild) return [];
    return entries
      .filter(e => e.childId === currentChild.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, currentChild]);

  // Handler to create and immediately navigate to new entry with date selection
  const handleCreateEntryWithDate = useCallback(async (date: string) => {
    if (!currentChild) return;

    // Check if entry already exists for this date
    const existingEntry = entries.find(
      e => e.childId === currentChild.id && e.date === date
    );

    if (existingEntry) {
      setCurrentEntry(existingEntry);
      setShowDatePicker(false);
      return;
    }

    setIsCreatingEntry(true);
    try {
      const entry = await createEntry(date, currentChild.id);
      setCurrentEntry(entry);
      setShowDatePicker(false);
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsCreatingEntry(false);
    }
  }, [currentChild, entries, setCurrentEntry, createEntry]);

  // Quick handler for today's entry
  const handleCreateTodayEntry = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleCreateEntryWithDate(today);
  }, [handleCreateEntryWithDate]);

  const handleGetStarted = useCallback(() => {
    localStorage.setItem('pcal_welcome_seen', 'true');
    setShowWelcome(false);
    setShowChildForm(true);
  }, []);

  // Show welcome screen for first-time users
  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        {!showChildForm && !currentChild && (
          <button
            type="button"
            onClick={() => setShowChildForm(true)}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2" />
            {t('dashboard.addChild')}
          </button>
        )}
      </div>

      {/* Create Child Sheet */}
      {showChildForm && (
        <Sheet onClose={() => setShowChildForm(false)} title={t('dashboard.addNewChild')} size="sm">
          <ChildForm
            onChildCreated={(child) => {
              setCurrentChild(child);
              setShowChildForm(false);
            }}
            onCancel={() => setShowChildForm(false)}
          />
        </Sheet>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Children List (Sidebar style on large screens) */}
        <ChildList showChildForm={showChildForm} />

        {/* Entries Section */}
        <div className="sm:col-span-2 space-y-4">
          {currentChild ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  {t('dashboard.activityLogs')}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {childEntries.length > 0 && !showDatePicker && (
                    <button
                      onClick={onNavigateToExport}
                      className="btn-secondary"
                    >
                      <FileDown size={18} className="mr-2" />
                      {t('dashboard.exportPdf')}
                    </button>
                  )}
                  {!showDatePicker && (
                    <>
                      <button
                        onClick={handleCreateTodayEntry}
                        className="btn-primary bg-accent hover:bg-accent/90 focus:ring-accent"
                        disabled={isCreatingEntry}
                      >
                        {isCreatingEntry ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            {t('common.creating')}
                          </>
                        ) : (
                          <>
                            <Plus size={18} className="mr-2" />
                            {t('dashboard.logToday')}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                          setShowDatePicker(true);
                        }}
                        className="btn-secondary"
                      >
                        <Calendar size={18} className="mr-2" />
                        {t('dashboard.pickDate')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Date Picker Sheet */}
              {showDatePicker && (
                <Sheet
                  onClose={() => setShowDatePicker(false)}
                  title={t('dashboard.selectActivityDate')}
                  size="sm"
                  footer={
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="btn-secondary flex-1"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => handleCreateEntryWithDate(selectedDate)}
                        className="btn-primary flex-1 bg-accent hover:bg-accent/90"
                        disabled={isCreatingEntry}
                      >
                        {isCreatingEntry ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            {t('common.creating')}
                          </>
                        ) : (
                          t('dashboard.createEntry')
                        )}
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <label className="label-text mb-2">{t('dashboard.chooseDate')}</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="input-field w-full text-lg py-3"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        {t('dashboard.dateHelperText')}
                      </p>
                    </div>
                  </div>
                </Sheet>
              )}

              <EntryList />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t('dashboard.selectChild')}</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                {t('dashboard.selectChildMessage')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
