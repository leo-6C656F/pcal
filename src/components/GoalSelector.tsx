import { useStore } from '../store';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { getGoalColors, getGoalIcon } from '../utils/goalColors';
import { HelpTooltip } from './HelpTooltip';

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
    console.log('=== ACTIVITY TOGGLE ===');
    console.log('Activity:', activity);
    console.log('Current selectedActivities:', selectedActivities);
    console.log('Selected Goal Code:', selectedGoalCode);
    console.log('Selected Goal:', selectedGoal);

    if (selectedActivities.includes(activity)) {
      const newActivities = selectedActivities.filter(a => a !== activity);
      console.log('Removing activity, new list:', newActivities);
      onActivitiesChange(newActivities);
    } else {
      const newActivities = [...selectedActivities, activity];
      console.log('Adding activity, new list:', newActivities);
      onActivitiesChange(newActivities);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">
          No goals configured. Please add goals in Goals & Setup.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Goal Selection - Radio Buttons with Color Coding */}
      <div>
        <label className="label-text mb-3 flex items-center gap-2">
          <Target size={16} className="text-indigo-600" />
          What did you work on?
          <HelpTooltip content="Pick the developmental goal you focused on during this activity. Each goal has different learning activities." />
        </label>
        <div className="space-y-3">
          {goals.map(goal => {
            const isSelected = selectedGoalCode === goal.code;
            const colors = getGoalColors(goal.code);
            return (
              <label
                key={goal.code}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                  isSelected
                    ? `${colors.bg} ${colors.border} shadow-sm`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  value={goal.code}
                  checked={isSelected}
                  onChange={(e) => {
                    onGoalChange(parseInt(e.target.value));
                    onActivitiesChange([]); // Reset activities when goal changes
                  }}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getGoalIcon(goal.code)}</span>
                    <span className={`font-semibold ${isSelected ? colors.text : 'text-slate-700'}`}>
                      Goal {goal.code}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isSelected ? colors.text : 'text-slate-600'}`}>
                    {goal.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Activity Selection - Checkbox based */}
      {selectedGoal && selectedGoal.activities.length > 0 && (
        <div>
          <div className="label-text mb-3 flex items-center gap-2">
            ✅ What activities did you do?
            <HelpTooltip content="Check all the activities you did together. You can select more than one!" />
          </div>
          <div className="space-y-2.5">
            {selectedGoal.activities.map((activity, index) => {
              const isSelected = selectedActivities.includes(activity);
              return (
                <label
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 min-h-[52px] ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleActivityToggle(activity)}
                    className="sr-only"
                  />
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2 size={24} className="text-indigo-600" />
                    ) : (
                      <Circle size={24} className="text-slate-300" />
                    )}
                  </div>
                  <span className={`text-base flex-1 ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
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
