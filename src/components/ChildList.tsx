import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { User } from 'lucide-react';
import { ChildListItem } from './ChildListItem';

interface ChildListProps {
  showChildForm: boolean;
}

export function ChildList({ showChildForm }: ChildListProps) {
  const { t } = useTranslation();
  const { children, currentChild, setCurrentChild } = useStore();

  return (
    <div className="space-y-4 sm:col-span-1">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <User size={20} className="text-primary" />
        {t('childList.title')}
      </h2>

      {children.length === 0 && !showChildForm && (
        <div className="card p-8 text-center border-dashed border-2 border-slate-300 bg-slate-50">
          <p className="text-slate-500 text-sm">{t('childList.noChildren')}</p>
        </div>
      )}

      <div className="space-y-3">
        {children.map((child) => (
          <ChildListItem
            key={child.id}
            child={child}
            isSelected={currentChild?.id === child.id}
            onSelect={setCurrentChild}
          />
        ))}
      </div>
    </div>
  );
}
