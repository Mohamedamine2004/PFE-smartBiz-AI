import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutDefinition {
  key: string;
  label: string;
  category: string;
  action: () => void;
}

/**
 * Keyboard shortcuts hook — registers global shortcuts and provides
 * a registry for the help modal.
 *
 * Usage:
 *   const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts();
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: ShortcutDefinition[] = [
    {
      key: 'g d',
      label: 'Go to Dashboard',
      category: 'Navigation',
      action: () => navigate('/dashboard'),
    },
    {
      key: 'g i',
      label: 'Go to Import',
      category: 'Navigation',
      action: () => navigate('/import'),
    },
    {
      key: 'g v',
      label: 'Go to Valuation',
      category: 'Navigation',
      action: () => navigate('/valuation'),
    },
    {
      key: 'g s',
      label: 'Go to Settings',
      category: 'Navigation',
      action: () => navigate('/settings'),
    },
    {
      key: 'g t',
      label: 'Go to Team',
      category: 'Navigation',
      action: () => navigate('/team'),
    },
    {
      key: '?',
      label: 'Show keyboard shortcuts help',
      category: 'General',
      action: () => setShowHelp((v) => !v),
    },
    {
      key: 'Escape',
      label: 'Close modal / dismiss',
      category: 'General',
      action: () => setShowHelp(false),
    },
  ];

  // Build a lookup map for quick access
  const shortcutMap = useCallback(() => {
    const map = new Map<string, () => void>();
    for (const s of shortcuts) {
      map.set(s.key, s.action);
    }
    return map;
  }, [shortcuts]);

  useEffect(() => {
    const map = shortcutMap();
    let pendingG = false;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea/select
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // Handle "g <key>" sequences (e.g., g+d)
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        pendingG = true;
        if (pendingTimer) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          pendingG = false;
        }, 800);
        return;
      }

      if (pendingG && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const combo = `g ${e.key}`;
        const action = map.get(combo);
        if (action) {
          e.preventDefault();
          action();
          pendingG = false;
          if (pendingTimer) clearTimeout(pendingTimer);
        }
        return;
      }

      // Handle single-key shortcuts (e.g., ?)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        let singleKey = e.key;
        // Shift+/ produces "?"
        if (e.shiftKey && e.key === '/') singleKey = '?';

        const action = map.get(singleKey);
        if (action) {
          e.preventDefault();
          action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingTimer) clearTimeout(pendingTimer);
    };
  }, [shortcutMap]);

  return { shortcuts, showHelp, setShowHelp };
};
