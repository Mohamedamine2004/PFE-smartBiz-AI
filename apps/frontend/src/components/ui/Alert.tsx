import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success';
  message: string | null | undefined;
  /** "box" = background + border (forms), "inline" = icon + text only (settings) */
  variant?: 'box' | 'inline';
}

export const Alert = ({ type = 'error', message, variant = 'box' }: AlertProps) => {
  if (!message) return null;

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  const colorClass = isError ? 'text-error' : 'text-success';

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm ${colorClass}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  // Box variant (default)
  const bgClass = isError
    ? 'bg-error/10 border-error/20'
    : 'bg-success/10 border-success/20';

  return (
    <div className={`flex items-center space-x-2 space-x-reverse rounded-[8px] p-3 border transition-all ${bgClass}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mx-2 ${colorClass}`} />
      <p className={`text-sm font-medium leading-tight ${colorClass}`}>{message}</p>
    </div>
  );
};
