import { useTranslation } from 'react-i18next';
import { Info, HelpCircle } from 'lucide-react';
import { Tooltip } from '../ui';
import type { ValuationMethod, ValuationMethodInfo } from '../../types/valuation';

interface Props {
  methods: ValuationMethodInfo[];
  selected: ValuationMethod | null;
  onSelect: (method: ValuationMethod) => void;
}

export const MethodSelector = ({ methods, selected, onSelect }: Props) => {
  const { t } = useTranslation();
  const selectedMethod = methods.find((m) => m.id === selected);

  return (
    <div className="space-y-4">
      {/* Tab bar — horizontal scroll on mobile */}
      <nav className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide -mx-1 px-1">
        {methods.map((m) => {
          const isActive = m.id === selected;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'text-brand'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {m.name}
              <Tooltip content={`${m.description} — ${t('valuation.bestFor')}: ${m.bestUseCase}`} side="bottom">
                <HelpCircle className="w-3 h-3 text-text-muted/50" />
              </Tooltip>
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-t" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Contextual info — subtle, not a colored box */}
      {selectedMethod && (
        <div className="flex items-start gap-3 text-sm text-text-muted">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-text-muted" />
          <div className="space-y-0.5">
            <p className="font-mono text-xs text-text-main">{selectedMethod.formula}</p>
            <p className="text-xs">{selectedMethod.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};


