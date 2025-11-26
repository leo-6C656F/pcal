import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import type { Goal } from '../types';
import { Plus, Trash2, Edit, Target, AlertTriangle } from 'lucide-react';
import { GoalForm } from './GoalForm';
import { showToast } from '../App';

/**
 * GoalManager Component
 * Allows parents to add, edit, delete, and clear all goals
 */
export function GoalManager() {
  const { t } = useTranslation();
  const { goals, saveGoal, deleteGoal, clearAllGoals } = useStore();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const handleSaveGoal = async (goal: Goal) => {
    await saveGoal(goal);
    setShowGoalForm(false);
    setGoalToEdit(null);
    showToast.success(goalToEdit ? t('goalManager.goalUpdated') : t('goalManager.goalAdded'));
  };

  const handleDeleteGoal = async (code: number) => {
    await deleteGoal(code);
    setConfirmingDeleteId(null);
    showToast.info(t('goalManager.goalDeleted'));
  };

  const handleClearAll = async () => {
    await clearAllGoals();
    setConfirmingClearAll(false);
    showToast.info(t('goalManager.goalsReset'));
  };

  return (
    <div className="space-y-8">
      {showGoalForm && (
        <GoalForm
          goal={goalToEdit}
          onSave={handleSaveGoal}
          onClose={() => { setShowGoalForm(false); setGoalToEdit(null); }}
          existingCodes={goals.map(g => g.code)}
        />
      )}


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('goalManager.title')}</h1>
          <p className="text-slate-500 mt-1">{t('goalManager.subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          {confirmingClearAll ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <AlertTriangle size={16} className="text-rose-600" />
              <span className="text-sm text-rose-700">{t('goalManager.resetAllGoalsMessage')}</span>
              <button
                onClick={() => setConfirmingClearAll(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
              >
                {t('goalManager.resetAll')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClearAll(true)}
              className="btn-danger bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
            >
              {t('goalManager.resetAllGoals')}
            </button>
          )}
          <button
            onClick={() => { setGoalToEdit(null); setShowGoalForm(true); }}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2"/>
            {t('goalManager.addGoal')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Target size={32} className="text-blue-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-lg">{t('goalManager.noGoals')}</h3>
            <p className="text-slate-500 mt-2">{t('goalManager.noGoalsHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map(goal => (
              <div key={goal.code} className="card p-5 transition-all duration-200 hover:shadow-md">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-100 text-primary text-xs font-bold uppercase tracking-wide">
                        {t('common.goal')} {goal.code}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">
                      {goal.description}
                    </h4>

                    {goal.activities.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('goalManager.suggestedActivities')}</p>
                        <div className="flex flex-wrap gap-2">
                          {goal.activities.map((activity, idx) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {confirmingDeleteId === goal.code ? (
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
                          onClick={() => handleDeleteGoal(goal.code)}
                          className="px-2 py-0.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setGoalToEdit(goal); setShowGoalForm(true); }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(goal.code)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
