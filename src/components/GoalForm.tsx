import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Goal } from '../types';
import { Modal } from './Modal';
import { Plus, X } from 'lucide-react';

interface GoalFormProps {
  goal?: Goal | null;
  onSave: (goal: Goal) => void;
  onClose: () => void;
  existingCodes: number[];
}

export function GoalForm({ goal, onSave, onClose, existingCodes }: GoalFormProps) {
  const { t } = useTranslation();
  const [currentGoal, setCurrentGoal] = useState<Goal>({
    code: 1,
    description: '',
    activities: [],
  });
  const [newActivity, setNewActivity] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setCurrentGoal(goal);
    } else {
      // Find the next available code
      const nextCode = Math.max(0, ...existingCodes) + 1;
      setCurrentGoal({
        code: nextCode,
        description: '',
        activities: [],
      });
    }
  }, [goal, existingCodes]);

  const handleSave = () => {
    if (!currentGoal.description.trim()) {
      alert(t('goalForm.enterDescription'));
      return;
    }
    if (codeError) {
      alert(t('goalForm.fixErrors'));
      return;
    }
    onSave(currentGoal);
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setCurrentGoal({
        ...currentGoal,
        activities: [...currentGoal.activities, newActivity.trim()],
      });
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setCurrentGoal({
      ...currentGoal,
      activities: currentGoal.activities.filter((_, i) => i !== index),
    });
  };

  const handleCodeChange = (code: number) => {
    if (existingCodes.includes(code) && code !== goal?.code) {
      setCodeError(t('goalForm.goalCodeInUse', { code }));
    } else {
      setCodeError(null);
    }
    setCurrentGoal({ ...currentGoal, code });
  }

  return (
    <Modal onClose={onClose} title={goal ? t('goalForm.editGoal') : t('goalForm.addNewGoal')}>
      <div className="space-y-4">
        <div>
          <label className="label-text">{t('goalForm.goalNumber')}</label>
          <input
            type="number"
            value={currentGoal.code}
            onChange={(e) => handleCodeChange(parseInt(e.target.value) || 1)}
            className={`input-field ${codeError ? 'border-rose-500' : ''}`}
            min="1"
          />
          {codeError && <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{codeError}</p>}
        </div>

        <div>
          <label className="label-text">{t('goalForm.description')}</label>
          <textarea
            value={currentGoal.description}
            onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
            rows={3}
            className="input-field resize-none"
            placeholder={t('goalForm.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="label-text">{t('goalForm.suggestedActivities')}</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddActivity();
                }
              }}
              className="input-field"
              placeholder={t('goalForm.addActivityPlaceholder')}
            />
            <button onClick={handleAddActivity} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>

          {currentGoal.activities.length > 0 && (
            <div className="space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
              {currentGoal.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate mr-2">{activity}</span>
                  <button
                    onClick={() => handleRemoveActivity(idx)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex-shrink-0 p-1 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded"
                    aria-label="Remove activity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {goal ? t('goalForm.updateGoal') : t('goalForm.saveGoal')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
