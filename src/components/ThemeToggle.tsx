import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeMode } from '../contexts/ThemeContext';

/**
 * ThemeToggle Component
 * Dropdown menu for selecting light, dark, or system theme
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ];

  const currentThemeInfo = themes.find(t => t.value === theme) || themes[2];
  const CurrentIcon = currentThemeInfo.icon;

  const handleThemeSelect = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-slate-400 dark:hover:text-primary dark:hover:bg-slate-800 rounded-full transition-colors"
        aria-label={t('theme.selectTheme')}
        title={currentThemeInfo.label}
      >
        <CurrentIcon size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-slide-in-bottom">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.value;
            return (
              <button
                key={themeOption.value}
                onClick={() => handleThemeSelect(themeOption.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-slate-700 text-primary font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon size={16} />
                <span>{themeOption.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
