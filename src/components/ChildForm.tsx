import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import type { ChildContext } from '../types';
import { showToast } from '../App';

interface ChildFormProps {
  onChildCreated: (child: ChildContext) => void;
  onCancel: () => void;
}

export function ChildForm({ onChildCreated, onCancel }: ChildFormProps) {
  const { t } = useTranslation();
  const { createChild } = useStore();

  const [newChildData, setNewChildData] = useState({
    name: '',
    center: '',
    teacher: ''
  });

  const [childFormErrors, setChildFormErrors] = useState({
    name: '',
    center: '',
    teacher: ''
  });

  const [isCreatingChild, setIsCreatingChild] = useState(false);

  const validateChildForm = () => {
    const errors = {
      name: newChildData.name.trim() ? '' : t('childForm.childNameRequired'),
      center: newChildData.center.trim() ? '' : t('childForm.centerRequired'),
      teacher: newChildData.teacher.trim() ? '' : t('childForm.teacherRequired')
    };
    setChildFormErrors(errors);
    return !errors.name && !errors.center && !errors.teacher;
  };

  const handleCreateChild = async () => {
    if (!validateChildForm()) {
      return;
    }

    setIsCreatingChild(true);
    try {
      const child = await createChild(newChildData);
      onChildCreated(child);
    } catch (error) {
      console.error('Failed to create child:', error);
      showToast.error(t('childForm.failedToCreate'));
    } finally {
      setIsCreatingChild(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <div>
          <label className="label-text">{t('childForm.childName')}</label>
          <input
            type="text"
            value={newChildData.name}
            onChange={(e) => {
              setNewChildData({ ...newChildData, name: e.target.value });
              if (childFormErrors.name) {
                setChildFormErrors({ ...childFormErrors, name: '' });
              }
            }}
            className={`input-field ${childFormErrors.name ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder={t('childForm.childNamePlaceholder')}
          />
          {childFormErrors.name && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.name}
            </p>
          )}
        </div>
        <div>
          <label className="label-text">{t('childForm.center')}</label>
          <input
            type="text"
            value={newChildData.center}
            onChange={(e) => {
              setNewChildData({ ...newChildData, center: e.target.value });
              if (childFormErrors.center) {
                setChildFormErrors({ ...childFormErrors, center: '' });
              }
            }}
            className={`input-field ${childFormErrors.center ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder={t('childForm.centerPlaceholder')}
          />
          {childFormErrors.center && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.center}
            </p>
          )}
        </div>
        <div>
          <label className="label-text">{t('childForm.teacher')}</label>
          <input
            type="text"
            value={newChildData.teacher}
            onChange={(e) => {
              setNewChildData({ ...newChildData, teacher: e.target.value });
              if (childFormErrors.teacher) {
                setChildFormErrors({ ...childFormErrors, teacher: '' });
              }
            }}
            className={`input-field ${childFormErrors.teacher ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder={t('childForm.teacherPlaceholder')}
          />
          {childFormErrors.teacher && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.teacher}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="btn-secondary"
          disabled={isCreatingChild}
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleCreateChild}
          className="btn-primary"
          disabled={isCreatingChild}
        >
          {isCreatingChild ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              {t('common.creating')}
            </>
          ) : (
            t('childForm.createProfile')
          )}
        </button>
      </div>
    </div>
  );
}
