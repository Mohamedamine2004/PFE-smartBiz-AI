import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Show spinner & disable the button */
  loading?: boolean;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gradient';
  /** Icon element shown before children (replaced by spinner when loading) */
  icon?: ReactNode;
  /** Stretch to full width */
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'btn-primary hover:-translate-y-0.5 hover:shadow-lg',
  secondary: 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
  gradient: 'flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand via-cyan-400 to-brand bg-[length:200%_100%] hover:bg-[length:100%_100%] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/25',
  outline:
    'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-text-muted hover:text-text-main hover:border-brand/30 hover:bg-brand/5 transition-all duration-200 hover:-translate-y-0.5',
  danger:
    'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-text-muted hover:text-error hover:border-error/30 hover:bg-error/5 transition-all duration-200 hover:-translate-y-0.5',
  ghost:
    'flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-text-muted hover:text-text-main hover:bg-elevated/60 transition-all duration-200',
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
    className={`${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
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
