import type { ComponentType } from 'react';

interface ChartHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  /** Optional slot for right-side content (badges, KPIs, etc.) */
  children?: React.ReactNode;
}

/**
 * Reusable chart header used across all dashboard chart components.
 * Provides consistent typography, icon placement, and layout.
 */
export const ChartHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-brand',
  children,
}: ChartHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
    <div className="space-y-1 text-left">
      <h3
        className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {Icon && <Icon className={`w-5 h-5 ${iconClassName}`} />}
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs font-medium text-text-muted">{subtitle}</p>
      )}
    </div>
    {children}
  </div>
);
