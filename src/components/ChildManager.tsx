import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Trash2, Users, AlertTriangle } from 'lucide-react';
import { showToast } from '../App';

/**
 * ChildManager Component
 * Allows parents to manage and delete children from settings
 * Placed in settings to prevent accidental deletion
 */
export function ChildManager() {
  const { t } = useTranslation();
  const { children, entries, deleteChild } = useStore();

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleDeleteChild = async (id: string) => {
    await deleteChild(id);
    setConfirmingDeleteId(null);
    showToast.info(t('childManager.childDeleted'));
  };

  const getEntryCount = (childId: string) => {
    return entries.filter(e => e.childId === childId).length;
  };

  return (
    <div className="space-y-6">
      {children.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-blue-300" />
          </div>
          <h3 className="text-slate-900 font-medium text-lg">{t('childManager.noChildren')}</h3>
          <p className="text-slate-500 mt-2">{t('childManager.noChildrenHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t('childManager.warningTitle')}</p>
              <p className="text-sm text-amber-700 mt-1">{t('childManager.warningMessage')}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {children.map(child => {
              const entryCount = getEntryCount(child.id);
              return (
                <div key={child.id} className="card p-5 transition-all duration-200 hover:shadow-md">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        {child.name}
                      </h4>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>{t('childManager.center')}: {child.center}</span>
                        <span>{t('childManager.teacher')}: {child.teacher}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {entryCount} {entryCount === 1 ? t('common.entry') : t('common.entriesPlural')}
                      </div>
                    </div>

                    {confirmingDeleteId === child.id ? (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in-0 zoom-in-95 duration-150">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span className="text-xs text-rose-700">{t('common.delete')}?</span>
                        <button
                          onClick={() => setConfirmingDeleteId(null)}
                          className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => handleDeleteChild(child.id)}
                          className="px-2 py-0.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(child.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={t('childManager.deleteChild')}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
