import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Goal } from '../types';
import { Sheet } from './Sheet';
import { Plus, X } from 'lucide-react';
import { showToast } from '../App';

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
      showToast?.error(t('goalForm.enterDescription'));
      return;
    }
    if (codeError) {
      showToast?.error(t('goalForm.fixErrors'));
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
    <Sheet
      onClose={onClose}
      title={goal ? t('goalForm.editGoal') : t('goalForm.addNewGoal')}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 text-sm py-2">
            {goal ? t('goalForm.updateGoal') : t('goalForm.saveGoal')}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label-text text-xs">{t('goalForm.goalNumber')}</label>
          <input
            type="number"
            value={currentGoal.code}
            onChange={(e) => handleCodeChange(parseInt(e.target.value) || 1)}
            className={`input-field text-sm py-1.5 ${codeError ? 'border-rose-500' : ''}`}
            min="1"
          />
          {codeError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{codeError}</p>}
        </div>

        <div>
          <label className="label-text text-xs">{t('goalForm.description')}</label>
          <textarea
            value={currentGoal.description}
            onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
            rows={2}
            className="input-field resize-none text-sm py-1.5"
            placeholder={t('goalForm.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="label-text text-xs">{t('goalForm.suggestedActivities')}</label>
          <div className="flex gap-1.5 mb-1.5">
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
              className="input-field text-sm py-1.5"
              placeholder={t('goalForm.addActivityPlaceholder')}
            />
            <button onClick={handleAddActivity} className="btn-secondary px-2">
              <Plus size={16} />
            </button>
          </div>

          {currentGoal.activities.length > 0 && (
            <div className="space-y-1 p-1.5 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
              {currentGoal.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate mr-1.5">{activity}</span>
                  <button
                    onClick={() => handleRemoveActivity(idx)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex-shrink-0 p-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded"
                    aria-label="Remove activity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
