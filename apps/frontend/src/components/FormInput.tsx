import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
  /** Optional element rendered at the right of the label row (e.g. "Forgot password?" link) */
  headerRight?: ReactNode;
}

export const FormInput = ({ label, error, register, className = '', type, headerRight, ...props }: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div className={`flex items-center ${headerRight ? 'justify-between' : ''} mb-1.5`}>
        <label className="block text-sm font-medium text-text-main">
          {label}
        </label>
        {headerRight}
      </div>
      <div className="relative">
        <input
          {...register}
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`input ${error ? 'border-error focus:border-error' : ''} ${isPassword ? 'pr-11' : ''} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error font-medium">{error}</p>
      )}
    </div>
  );
};