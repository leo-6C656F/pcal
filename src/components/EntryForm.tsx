import { useState } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import type { DailyEntry } from '../types';

interface EntryFormProps {
  onEntryCreated: (entry: DailyEntry) => void;
}

export function EntryForm({ onEntryCreated }: EntryFormProps) {
  const { createEntry, entries, currentChild, setCurrentEntry } = useStore();
  const [newEntryData, setNewEntryData] = useState({
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  const handleCreateEntry = async () => {
    if (!currentChild || !newEntryData.date) {
      return;
    }

    // Check if entry already exists for this date
    const existingEntry = entries.find(
      e => e.childId === currentChild.id && e.date === newEntryData.date
    );

    if (existingEntry) {
      setCurrentEntry(existingEntry);
      return;
    }

    setIsCreatingEntry(true);
    try {
      const entry = await createEntry(newEntryData.date, currentChild.id);
      onEntryCreated(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsCreatingEntry(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label-text">Date</label>
        <input
          type="date"
          value={newEntryData.date}
          onChange={(e) => setNewEntryData({ date: e.target.value })}
          className="input-field"
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleCreateEntry}
          className="btn-primary bg-accent hover:bg-accent/90 focus:ring-accent"
          disabled={isCreatingEntry}
        >
          {isCreatingEntry ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Entry'
          )}
        </button>
      </div>
    </div>
  );
}
