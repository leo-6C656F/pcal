import { useStore } from '../store';

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
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-900">
          No goals have been set up yet. Please add goals in the Settings section to begin tracking activities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Goal
        </label>
        <select
          value={selectedGoalCode}
          onChange={(e) => {
            onGoalChange(parseInt(e.target.value));
            onActivitiesChange([]); // Reset activities when goal changes
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {goals.map(goal => (
            <option key={goal.code} value={goal.code}>
              Goal {goal.code}: {goal.description}
            </option>
          ))}
        </select>
      </div>

      {/* Goal Description */}
      {selectedGoal && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Goal {selectedGoal.code}:</span> {selectedGoal.description}
          </p>
        </div>
      )}

      {/* Activity Selection */}
      {selectedGoal && selectedGoal.activities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Activities
          </label>
          <div className="space-y-2">
            {selectedGoal.activities.map((activity, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(activity)}
                  onChange={() => handleActivityToggle(activity)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{activity}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Selected Activities Summary */}
      {selectedActivities.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm font-medium text-green-900 mb-1">Selected:</p>
          <p className="text-sm text-green-800">{selectedActivities.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
