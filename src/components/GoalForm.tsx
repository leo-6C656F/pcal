import { useState, useEffect } from 'react';
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
      alert('Please enter a goal description');
      return;
    }
    if (codeError) {
      alert('Please fix the errors before saving.');
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
      setCodeError(`Goal code ${code} is already in use.`);
    } else {
      setCodeError(null);
    }
    setCurrentGoal({ ...currentGoal, code });
  }

  return (
    <Modal onClose={onClose} title={goal ? 'Edit Goal' : 'Add New Goal'}>
      <div className="space-y-6">
        <div>
          <label className="label-text">Goal Number</label>
          <input
            type="number"
            value={currentGoal.code}
            onChange={(e) => handleCodeChange(parseInt(e.target.value) || 1)}
            className={`input-field ${codeError ? 'border-rose-500' : ''}`}
            min="1"
          />
          {codeError && <p className="text-sm text-rose-600 mt-1">{codeError}</p>}
        </div>

        <div>
          <label className="label-text">Description</label>
          <textarea
            value={currentGoal.description}
            onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
            rows={4}
            className="input-field resize-none"
            placeholder="e.g., Child will manage actions and behavior..."
          />
        </div>

        <div>
          <label className="label-text">Suggested Activities</label>
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
            <button onClick={handleAddActivity} className="btn-secondary px-3">
              <Plus size={20} />
            </button>
          </div>

          {currentGoal.activities.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg">
              {currentGoal.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm">
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

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {goal ? 'Update Goal' : 'Save Goal'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
