import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Show spinner & disable the button */
  loading?: boolean;
  /** Visual variant */
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  /** Icon element shown before children (replaced by spinner when loading) */
  icon?: ReactNode;
  /** Stretch to full width */
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'btn-primary',
  outline:
    'flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-border rounded-lg text-text-muted hover:text-text-main transition-colors',
  danger:
    'flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-border rounded-lg text-text-muted hover:text-error transition-colors',
  ghost:
    'flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg text-text-muted hover:text-text-main hover:bg-elevated/60 transition-colors',
};

export const Button = ({
  loading,
  variant = 'primary',
  icon,
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
    ) : icon ? (
      <span className="mr-2 inline-flex items-center">{icon}</span>
    ) : null}
    {children}
  </button>
);
