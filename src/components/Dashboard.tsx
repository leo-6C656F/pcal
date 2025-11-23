import { useState } from 'react';
import { useStore } from '../store';
import { Plus, Calendar, User, FileDown } from 'lucide-react';
import { ChildForm } from './ChildForm';
import { ChildList } from './ChildList';
import { EntryForm } from './EntryForm';
import { EntryList } from './EntryList';
import { PDFExportModal } from './PDFExportModal';
import { Modal } from './Modal';

/**
 * Dashboard Component
 * Manages children and daily entries
 */
export function Dashboard() {
  const {
    entries,
    currentChild,
    setCurrentChild,
    setCurrentEntry,
  } = useStore();

  const [showChildForm, setShowChildForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);

  const childEntries = currentChild
    ? entries.filter(e => e.childId === currentChild.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your children and activity logs</p>
        </div>
        {!showChildForm && !showEntryForm && (
          <button
            type="button"
            onClick={() => setShowChildForm(true)}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Add Child
          </button>
        )}
      </div>

      {/* Create Child Modal/Form area */}
      {showChildForm && (
        <Modal onClose={() => setShowChildForm(false)} title="Add New Child">
          <ChildForm
            onChildCreated={(child) => {
              setCurrentChild(child);
              setShowChildForm(false);
            }}
          />
        </Modal>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Children List (Sidebar style on large screens) */}
        <ChildList showChildForm={showChildForm} />

        {/* Entries Section */}
        <div className="sm:col-span-2 space-y-4">
          {currentChild ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  Activity Logs
                </h2>
                <div className="flex gap-2">
                  {childEntries.length > 0 && !showPDFExport && !showEntryForm && (
                    <button
                      onClick={() => setShowPDFExport(true)}
                      className="btn-secondary"
                    >
                      <FileDown size={18} className="mr-2" />
                      Export PDF
                    </button>
                  )}
                  {!showEntryForm && !showPDFExport && (
                    <button
                      onClick={() => setShowEntryForm(true)}
                      className="btn-primary bg-accent hover:bg-accent/90 focus:ring-accent"
                    >
                      <Plus size={18} className="mr-2" />
                      New Entry
                    </button>
                  )}
                </div>
              </div>

              {showEntryForm && (
                <Modal onClose={() => setShowEntryForm(false)} title="Create New Entry">
                  <EntryForm
                    onEntryCreated={(entry) => {
                      setCurrentEntry(entry);
                      setShowEntryForm(false);
                    }}
                  />
                </Modal>
              )}

              {showPDFExport && (
                <PDFExportModal
                  onClose={() => setShowPDFExport(false)}
                  childEntries={childEntries}
                />
              )}

              <EntryList />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Select a Child</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                Select a child from the list on the left or create a new profile to manage activity logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
