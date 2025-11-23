import { useState } from 'react';
import { useStore } from '../store';
import type { Goal } from '../types';
import { Plus, Trash2, Edit, Save, X, Target } from 'lucide-react';

/**
 * GoalManager Component
 * Allows parents to add, edit, delete, and clear all goals
 */
export function GoalManager() {
  const goals = useStore(state => state.goals);
  const saveGoal = useStore(state => state.saveGoal);
  const deleteGoal = useStore(state => state.deleteGoal);
  const clearAllGoals = useStore(state => state.clearAllGoals);

  const [isEditing, setIsEditing] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal>({
    code: goals.length + 1,
    description: '',
    activities: []
  });
  const [newActivity, setNewActivity] = useState('');

  const handleSaveGoal = async () => {
    if (!currentGoal.description.trim()) {
      alert('Please enter a goal description');
      return;
    }

    await saveGoal(currentGoal);
    setIsEditing(false);
    setCurrentGoal({
      code: goals.length + 2,
      description: '',
      activities: []
    });
    setNewActivity('');
  };

  const handleEditGoal = (goal: Goal) => {
    setCurrentGoal(goal);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGoal = async (code: number) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(code);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all goals? This action cannot be undone.')) {
      await clearAllGoals();
      setCurrentGoal({
        code: 1,
        description: '',
        activities: []
      });
    }
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setCurrentGoal({
        ...currentGoal,
        activities: [...currentGoal.activities, newActivity.trim()]
      });
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setCurrentGoal({
      ...currentGoal,
      activities: currentGoal.activities.filter((_, i) => i !== index)
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentGoal({
      code: goals.length + 1,
      description: '',
      activities: []
    });
    setNewActivity('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Goal Management</h1>
          <p className="text-slate-500 mt-1">Customize developmental goals and activities</p>
        </div>
        {goals.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-danger bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
          >
            Reset All Goals
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 border-indigo-100 ring-4 ring-indigo-50/50">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              {isEditing ? <Edit size={20} className="text-indigo-600" /> : <Plus size={20} className="text-indigo-600" />}
              {isEditing ? 'Edit Goal' : 'Add New Goal'}
            </h3>

            <div className="space-y-5">
              <div>
                <label className="label-text">Goal Number</label>
                <input
                  type="number"
                  value={currentGoal.code}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, code: parseInt(e.target.value) || 1 })}
                  className="input-field"
                  min="1"
                />
              </div>

              <div>
                <label className="label-text">Description</label>
                <textarea
                  value={currentGoal.description}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="e.g., Child will manage actions and behavior with support of familiar adults"
                />
              </div>

              <div>
                <label className="label-text">Activities</label>
                <div className="flex gap-2 mb-3">
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
                    placeholder="Add activity..."
                  />
                  <button
                    onClick={handleAddActivity}
                    className="btn-secondary px-3"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {currentGoal.activities.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentGoal.activities.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                        <span className="text-slate-700 truncate mr-2">{activity}</span>
                        <button
                          onClick={() => handleRemoveActivity(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveGoal}
                  className="flex-1 btn-primary"
                >
                  <Save size={18} className="mr-2" />
                  {isEditing ? 'Update' : 'Save'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
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
                <div key={goal.code} className={`card p-5 transition-all duration-200 hover:shadow-md ${isEditing && currentGoal.code === goal.code ? 'ring-2 ring-indigo-500 border-transparent' : ''}`}>
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

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.code)}
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
    </div>
  );
}
