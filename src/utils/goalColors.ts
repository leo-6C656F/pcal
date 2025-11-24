/**
 * Goal Color Utilities
 * Provides consistent color-coding for developmental goals throughout the app
 */

export interface GoalColorScheme {
  bg: string;
  border: string;
  text: string;
  icon: string;
  badge: string;
}

/**
 * Get color scheme for a specific goal code
 */
export function getGoalColors(code: number): GoalColorScheme {
  const colorSchemes: Record<number, GoalColorScheme> = {
    1: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    2: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    3: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-700 border-green-200',
    },
    4: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    5: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      icon: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    6: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-900',
      icon: 'text-cyan-600',
      badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  };

  return colorSchemes[code] || {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-900',
    icon: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

/**
 * Get goal icon/emoji for a specific goal code
 */
export function getGoalIcon(code: number): string {
  const icons: Record<number, string> = {
    1: '🎯', // Behavior management
    2: '👤', // Self-awareness
    3: '📚', // Comprehension
    4: '🧩', // Spatial awareness
    5: '🏃', // Movement
    6: '💬', // Communication
  };
  return icons[code] || '📝';
}
