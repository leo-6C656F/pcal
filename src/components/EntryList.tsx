import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Calendar } from 'lucide-react';
import { EntryListItem } from './EntryListItem';

export function EntryList() {
  const { t } = useTranslation();
  const { entries, currentChild } = useStore();

  const childEntries = currentChild
    ? entries.filter(e => e.childId === currentChild.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  if (childEntries.length === 0) {
    return (
      <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
        <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Calendar size={24} />
        </div>
        <h3 className="text-slate-900 font-medium">{t('entryList.noEntries')}</h3>
        <p className="text-slate-500 text-sm mt-1">{t('entryList.noEntriesHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {childEntries.map((entry) => (
        <EntryListItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
