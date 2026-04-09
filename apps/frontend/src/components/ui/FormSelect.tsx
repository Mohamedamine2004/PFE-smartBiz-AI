import type { SelectHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface Option {
  value: string | number;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: Option[];
  placeholder?: string;
  error?: string;
  register?: UseFormRegisterReturn;
}

export const FormSelect = ({
  label,
  options,
  placeholder,
  error,
  register,
  className = '',
  ...props
}: FormSelectProps) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-text-main">{label}</label>
    <select
      className={`input w-full ${error ? 'border-error focus:border-error' : ''} ${className}`}
      {...register}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1.5 text-sm text-error font-medium">{error}</p>}
  </div>
);
