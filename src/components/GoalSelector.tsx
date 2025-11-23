import { useStore } from '../store';
import { CheckCircle2, Circle } from 'lucide-react';

interface GoalSelectorProps {
  selectedGoalCode: number;
  selectedActivities: string[];
  onGoalChange: (goalCode: number) => void;
  onActivitiesChange: (activities: string[]) => void;
}

/**
 * GoalSelector Component
 * Allows user to select a goal and associated activities from custom goals
 */
export function GoalSelector({
  selectedGoalCode,
  selectedActivities,
  onGoalChange,
  onActivitiesChange
}: GoalSelectorProps) {
  const goals = useStore(state => state.goals);
  const selectedGoal = goals.find(g => g.code === selectedGoalCode);

  const handleActivityToggle = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      onActivitiesChange(selectedActivities.filter(a => a !== activity));
    } else {
      onActivitiesChange([...selectedActivities, activity]);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">
          No goals configured. Please add goals in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Goal Selection */}
      <div>
        <label className="label-text">Select Goal</label>
        <div className="relative">
          <select
            value={selectedGoalCode}
            onChange={(e) => {
              onGoalChange(parseInt(e.target.value));
              onActivitiesChange([]); // Reset activities when goal changes
            }}
            className="input-field appearance-none bg-white"
          >
            {goals.map(goal => (
              <option key={goal.code} value={goal.code}>
                Goal {goal.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Goal Description */}
      {selectedGoal && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-indigo-900 font-medium leading-relaxed">
            {selectedGoal.description}
          </p>
        </div>
      )}

      {/* Activity Selection */}
      {selectedGoal && selectedGoal.activities.length > 0 && (
        <div>
          <label className="label-text mb-3">Suggested Activities</label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {selectedGoal.activities.map((activity, index) => {
              const isSelected = selectedActivities.includes(activity);
              return (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleActivityToggle(activity)}
                      className="sr-only"
                    />
                    {isSelected ? (
                      <CheckCircle2 size={18} className="text-indigo-600" />
                    ) : (
                      <Circle size={18} className="text-slate-300" />
                    )}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                    {activity}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
