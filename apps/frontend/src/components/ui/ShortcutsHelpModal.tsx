import { X } from 'lucide-react';
import type { ShortcutDefinition } from '../hooks/useKeyboardShortcuts';

interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts: ShortcutDefinition[];
}

/**
 * Modal showing all registered keyboard shortcuts grouped by category.
 */
export const ShortcutsHelpModal = ({ open, onClose, shortcuts }: ShortcutsHelpModalProps) => {
  if (!open) return null;

  // Group shortcuts by category
  const grouped: Record<string, ShortcutDefinition[]> = {};
  for (const s of shortcuts) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div
        className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-main">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {category}
              </h3>
              <div className="space-y-1.5">
                {items.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-main">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.key.split(' ').map((part, idx) => (
                        <kbd
                          key={idx}
                          className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-medium text-text-muted bg-elevated border border-border rounded-md shadow-sm"
                        >
                          {part.toUpperCase()}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            Press <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-xs font-mono bg-elevated border border-border rounded">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
};
