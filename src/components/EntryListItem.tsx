import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { format, parse } from 'date-fns';
import { Clock, ChevronRight } from 'lucide-react';
import type { DailyEntry } from '../types';

interface EntryListItemProps {
  entry: DailyEntry;
}

export const EntryListItem = memo(function EntryListItem({ entry }: EntryListItemProps) {
  const { t } = useTranslation();
  const { setCurrentEntry } = useStore();

  // Memoize date parsing and formatting to avoid recalculating on every render
  const { dayNum, monthYear, dayName } = useMemo(() => {
    const parsedDate = parse(entry.date, 'yyyy-MM-dd', new Date());
    return {
      dayNum: format(parsedDate, 'dd'),
      monthYear: format(parsedDate, 'MMMM yyyy'),
      dayName: format(parsedDate, 'EEEE'),
    };
  }, [entry.date]);

  return (
    <button
      onClick={() => setCurrentEntry(entry)}
      className="w-full text-left card p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
            entry.signatureBase64 ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
          }`}>
            {dayNum}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">
              {monthYear}
            </p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                {dayName}
              </span>
              <span className="text-sm text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                {entry.lines.length} {t('entryListItem.activities')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {entry.signatureBase64 && (
            <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20">
              {t('common.signed')}
            </span>
          )}
          <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </button>
  );
});
