import { useState } from 'react';
import { useStore } from '../store';
import type { Goal } from '../types';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Goals</h2>
        {goals.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear All Goals
          </button>
        )}
      </div>

      {/* Existing Goals */}
      {goals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Goals</h3>
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.code} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      Goal {goal.code}: {goal.description}
                    </h4>
                    {goal.activities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Activities:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {goal.activities.map((activity, idx) => (
                            <li key={idx}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.code)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Goal Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Goal' : 'Add New Goal'}
        </h3>

        <div className="space-y-4">
          {/* Goal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Number
            </label>
            <input
              type="number"
              value={currentGoal.code}
              onChange={(e) => setCurrentGoal({ ...currentGoal, code: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Description
            </label>
            <textarea
              value={currentGoal.description}
              onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Child will manage actions and behavior with support of familiar adults"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activities
            </label>

            {/* Current Activities */}
            {currentGoal.activities.length > 0 && (
              <div className="mb-3 space-y-2">
                {currentGoal.activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">{activity}</span>
                    <button
                      onClick={() => handleRemoveActivity(idx)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Activity */}
            <div className="flex space-x-2">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add an activity (e.g., Visuals)"
              />
              <button
                onClick={handleAddActivity}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSaveGoal}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? 'Update Goal' : 'Save Goal'}
            </button>
            {isEditing && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Add goals that match your child's individual needs</li>
          <li>Each goal should have a number and description</li>
          <li>Add activities that support each goal</li>
          <li>Goals can be edited or deleted at any time</li>
          <li>Use "Clear All Goals" to start fresh (this cannot be undone)</li>
        </ul>
      </div>
    </div>
  );
}
