import { useTranslation } from 'react-i18next';
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
 * Smart layout showing all goals and activities in a grid
 * - Desktop: 2-column grid with goals and nested activities
 * - Mobile: Single column, stacked layout
 */
export function GoalSelector({
  selectedGoalCode,
  selectedActivities,
  onGoalChange,
  onActivitiesChange
}: GoalSelectorProps) {
  const { t } = useTranslation();
  const goals = useStore(state => state.goals);

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
          {t('goalSelector.noGoals')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target size={16} className="text-primary" />
        <span className="label-text">{t('goalSelector.whatDidYouWorkOn')}</span>
        <HelpTooltip content={t('goalSelector.whatDidYouWorkOnTooltip')} />
      </div>

      {/* Smart Grid Layout - All Goals Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map(goal => {
          const isSelected = selectedGoalCode === goal.code;
          const colors = getGoalColors(goal.code);
          const hasActivities = goal.activities.length > 0;

          return (
            <div
              key={goal.code}
              className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                isSelected
                  ? `${colors.border} shadow-md ring-2 ring-offset-1 ${colors.border.replace('border-', 'ring-')}`
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Goal Header - Clickable to select */}
              <button
                type="button"
                onClick={() => {
                  onGoalChange(goal.code);
                  onActivitiesChange([]); // Reset activities when goal changes
                }}
                className={`w-full p-3 text-left transition-colors ${
                  isSelected ? colors.bg : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getGoalIcon(goal.code)}</span>
                  <span className={`font-semibold text-sm ${isSelected ? colors.text : 'text-slate-700'}`}>
                    {t('common.goal')} {goal.code}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={16} className={colors.icon} />
                  )}
                </div>
                <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? colors.text : 'text-slate-500'}`}>
                  {goal.description}
                </p>
              </button>

              {/* Activities - Always visible, but only interactive when goal is selected */}
              {hasActivities && (
                <div className={`border-t ${isSelected ? colors.border : 'border-slate-100'}`}>
                  <div className={`p-2 space-y-1 ${isSelected ? 'bg-white/80' : 'bg-slate-50/50'}`}>
                    {goal.activities.map((activity, index) => {
                      const isActivitySelected = isSelected && selectedActivities.includes(activity);
                      const isInteractive = isSelected;

                      return (
                        <label
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                            isInteractive
                              ? 'cursor-pointer hover:bg-white'
                              : 'cursor-default opacity-60'
                          } ${
                            isActivitySelected
                              ? `${colors.bg} ${colors.border} border`
                              : 'border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isActivitySelected}
                            onChange={() => isInteractive && handleActivityToggle(activity)}
                            disabled={!isInteractive}
                            className="sr-only"
                          />
                          <div className="flex-shrink-0">
                            {isActivitySelected ? (
                              <CheckCircle2 size={18} className={colors.icon} />
                            ) : (
                              <Circle size={18} className={isInteractive ? 'text-slate-300' : 'text-slate-200'} />
                            )}
                          </div>
                          <span className={`flex-1 ${
                            isActivitySelected
                              ? `${colors.text} font-medium`
                              : isInteractive
                                ? 'text-slate-700'
                                : 'text-slate-400'
                          }`}>
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
        })}
      </div>

      {/* Selected activities summary */}
      {selectedActivities.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-primary mb-1">
            ✅ {t('goalSelector.selectedActivities', { count: selectedActivities.length })}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedActivities.map((activity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
