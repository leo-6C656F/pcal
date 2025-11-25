import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Don't prevent default for inputs/textareas unless specified
          const target = event.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            if (!shortcut.ctrl) return;
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common keyboard shortcut configurations
export const COMMON_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  CANCEL: { key: 'Escape', description: 'Cancel/Close' },
  NEW_ENTRY: { key: 'n', ctrl: true, description: 'New Entry' },
  SUBMIT: { key: 'Enter', ctrl: true, description: 'Submit' },
  DELETE: { key: 'Delete', description: 'Delete' },
  HELP: { key: '?', shift: true, description: 'Show Help' },
};
