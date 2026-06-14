import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Professional Input component for the SmartBiz Design System.
 * Standardizes styling across the application for focus states, borders, and error handling.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, containerClassName = '', className = '', ...props }, ref) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label 
            htmlFor={inputId} 
            className={`block text-sm font-semibold text-text-main/90 transition-colors ${isRTL ? 'text-right' : ''}`}
          >
            {label}
          </label>
        )}
        
        <div className="relative group">
          {icon && (
            <div className={`absolute top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors ${isRTL ? 'right-3.5' : 'left-3.5'}`}>
              {icon}
            </div>
          )}
          
          <input
            {...props}
            id={inputId}
            ref={ref}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`
              input w-full transition-all duration-200
              ${icon ? (isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4') : 'px-4'}
              ${error ? 'border-error focus:border-error focus:ring-error/20 bg-error/5' : ''}
              ${className}
            `}
          />
        </div>

        {error && (
          <div className={`flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-3.5 h-3.5 text-error" />
            <p className="text-xs font-medium text-error leading-none">
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

