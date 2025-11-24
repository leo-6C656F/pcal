import { useState } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import type { DailyEntry } from '../types';

interface PDFExportModalProps {
  onClose: () => void;
  childEntries: DailyEntry[];
}

export function PDFExportModal({ onClose, childEntries }: PDFExportModalProps) {
  const { goals, currentChild } = useStore();
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

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
    setShowPreview(true);
  };

  const selectedEntries = childEntries.filter(e => selectedEntryIds.has(e.id)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="card p-6 border-primary/20 ring-4 ring-primary/10 animate-in slide-in-from-top-4 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Export to PDF</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-slate-600">Select entries to include in PDF:</p>
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary hover:text-primary/90 font-medium"
            >
              {selectedEntryIds.size === childEntries.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {childEntries.map((entry) => (
              <label
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedEntryIds.has(entry.id)}
                  onChange={() => toggleEntrySelection(entry.id)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {format(new Date(entry.date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {entry.lines.length} {entry.lines.length === 1 ? 'activity' : 'activities'}
                    {entry.signatureBase64 && ' • Signed'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedEntryIds.size > 0 && currentChild && !showPreview && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-4">
              {selectedEntryIds.size} {selectedEntryIds.size === 1 ? 'entry' : 'entries'} selected
            </p>
            <button
              onClick={handleGeneratePDF}
              className="btn-primary w-full"
            >
              Generate PDF
            </button>
          </div>
        )}

        {showPreview && selectedEntryIds.size > 0 && currentChild && (
          <div className="pt-4 border-t border-slate-200">
            <PDFPreview
              entries={selectedEntries}
              child={currentChild}
              centerName={currentChild.center}
              teacherName={currentChild.teacher}
              goals={goals}
            />
          </div>
        )}
      </div>
    </div>
  );
}
