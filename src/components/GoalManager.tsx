import { useState } from 'react';
import { useStore } from '../store';
import type { Goal } from '../types';
import { Plus, Trash2, Edit, Target } from 'lucide-react';
import { GoalForm } from './GoalForm';
import { ConfirmDialog } from './ConfirmDialog';
import { showToast } from '../App';

/**
 * GoalManager Component
 * Allows parents to add, edit, delete, and clear all goals
 */
export function GoalManager() {
  const { goals, saveGoal, deleteGoal, clearAllGoals } = useStore();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveGoal = async (goal: Goal) => {
    await saveGoal(goal);
    setShowGoalForm(false);
    setGoalToEdit(null);
    showToast.success(goalToEdit ? 'Goal updated successfully!' : 'Goal added successfully!');
  };

  const handleDeleteGoal = async (code: number) => {
    await deleteGoal(code);
    setShowDeleteConfirm(null);
    showToast.info('Goal deleted.');
  };
  
  const handleClearAll = async () => {
    await clearAllGoals();
    setShowClearConfirm(false);
    showToast.info('All goals have been reset.');
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

      {showDeleteConfirm !== null && (
        <ConfirmDialog
          title="Delete Goal?"
          message="Are you sure you want to delete this goal? This action cannot be undone."
          onConfirm={() => handleDeleteGoal(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          variant="danger"
          confirmText="Delete"
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="Reset All Goals?"
          message="Are you sure you want to reset all goals to the default settings? This action cannot be undone."
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
          variant="danger"
          confirmText="Reset All"
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Goal Management</h1>
          <p className="text-slate-500 mt-1">Customize developmental goals and activities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
          >
            Reset All Goals
          </button>
          <button
            onClick={() => { setGoalToEdit(null); setShowGoalForm(true); }}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2"/>
            Add Goal
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Target size={32} className="text-indigo-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-lg">No Goals Defined</h3>
            <p className="text-slate-500 mt-2">Add your first developmental goal using the form.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map(goal => (
              <div key={goal.code} className="card p-5 transition-all duration-200 hover:shadow-md">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                        Goal {goal.code}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">
                      {goal.description}
                    </h4>

                    {goal.activities.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Suggested Activities</p>
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
                    <button
                      onClick={() => { setGoalToEdit(goal); setShowGoalForm(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(goal.code)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
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
