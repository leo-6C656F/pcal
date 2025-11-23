import { useStore } from '../store';
import { format } from 'date-fns';
import { Clock, ChevronRight } from 'lucide-react';
import type { DailyEntry } from '../types';

interface EntryListItemProps {
  entry: DailyEntry;
}

export function EntryListItem({ entry }: EntryListItemProps) {
  const { setCurrentEntry } = useStore();

  return (
    <button
      onClick={() => setCurrentEntry(entry)}
      className="w-full text-left card p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
            entry.signatureBase64 ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
          }`}>
            {format(new Date(entry.date), 'dd')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">
              {format(new Date(entry.date), 'MMMM yyyy')}
            </p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                {format(new Date(entry.date), 'EEEE')}
              </span>
              <span className="text-sm text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                {entry.lines.length} Activities
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {entry.signatureBase64 && (
            <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20">
              Signed
            </span>
          )}
          <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </button>
  );
}
