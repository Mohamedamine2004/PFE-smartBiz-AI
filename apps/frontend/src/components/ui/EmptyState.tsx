import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Icon to display (lucide-react component) */
  icon?: LucideIcon;
  /** Optional custom icon element */
  iconElement?: ReactNode;
  /** Main heading/title */
  title: string;
  /** Descriptive text below title */
  description?: string;
  /** Primary action button */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action button */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Custom illustration (replaces icon) */
  illustration?: ReactNode;
  /** Extra content below description */
  extraContent?: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable empty-state component with illustration, helpful messaging, and CTAs.
 * Replaces generic blank states across all pages.
 */
export const EmptyState = ({
  icon: Icon,
  iconElement,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  illustration,
  extraContent,
  className = '',
}: EmptyStateProps) => (
  <div className={`card empty-state flex flex-col items-center justify-center text-center py-12 px-8 ${className}`}>
    {/* Illustration or Icon */}
    <div className="mb-6">
      {illustration ? (
        illustration
      ) : Icon ? (
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-brand" />
        </div>
      ) : iconElement ? (
        iconElement
      ) : null}
    </div>

    {/* Title */}
    <h3 className="text-lg font-semibold text-text-main mb-2">{title}</h3>

    {/* Description */}
    {description && (
      <p className="text-sm text-text-muted max-w-md mb-6">{description}</p>
    )}

    {/* Action Buttons */}
    {(actionLabel || secondaryLabel) && (
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    )}

    {/* Extra Content */}
    {extraContent && <div className="mt-4 w-full">{extraContent}</div>}
  </div>
);
