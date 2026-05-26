import { useState, useEffect } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
  headerRight?: ReactNode;
  validateOn?: 'blur' | 'change' | 'submit';
}

export const FormInput = ({ 
  label, 
  error, 
  register, 
  className = '', 
  type, 
  headerRight,
  value,
  defaultValue,
  validateOn = 'blur',
  ...props 
}: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isPassword = type === 'password';

  // Handle validation state
  useEffect(() => {
    if (validateOn === 'change' && !error) {
      setIsValidating(true);
      const timer = setTimeout(() => {
        setIsValidating(false);
        setShowSuccess(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value, validateOn, error]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (validateOn === 'blur' && !error) {
      setShowSuccess(e.target.value !== '');
    }
    register.onBlur && register.onBlur(e);
  };

  return (
    <div className="relative">
      <div className={`flex items-center ${headerRight ? 'justify-between' : ''} mb-2`}>
        <label className="block text-sm font-medium text-text-main relative">
          <span className={isFocused ? 'text-brand opacity-100 transition-colors' : 'opacity-80'}>
            {label}
          </span>
        </label>
        {headerRight}
      </div>
      
      <div className="relative group">
        <input
          {...register}
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          defaultValue={defaultValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            if (validateOn === 'change') {
              setShowSuccess(false);
            }
            register.onChange && register.onChange(e);
          }}
          className={`
            input-floating
            w-full rounded-xl px-4 py-3 
            transition-all duration-300 ease-out
            bg-surface/80 backdrop-blur-sm
            ${error 
              ? 'border-error focus:border-error ring-2 ring-error/20' 
              : showSuccess && !isFocused
                ? 'border-success focus:border-success ring-2 ring-success/20'
                : 'border-slate-200 dark:border-white/10 focus:border-brand'
            }
            ${isPassword ? 'pr-14' : ''} 
            ${isFocused ? 'shadow-lg ring-2 ring-brand/15 -translate-y-0.5' : 'shadow-sm'}
            ${className}
          `}
        />

        {/* Password toggle with animation */}
        {isPassword && (
          <motion.button
            type="button"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand transition-colors p-1"
            tabIndex={-1}
          >
            <motion.div
              animate={{ rotate: showPassword ? 0 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.div>
          </motion.button>
        )}

        {/* Validation icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-error" />
              </motion.div>
            ) : isValidating ? (
              <motion.div
                key="loading"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Loader2 className="w-5 h-5 text-brand animate-spin" />
              </motion.div>
            ) : showSuccess && !isFocused ? (
              <motion.div
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <CheckCircle className="w-5 h-5 text-success" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Focus ring gradient effect */}
        <motion.div
          className="absolute inset-0 rounded-xl -z-10 opacity-0"
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          }}
        />
      </div>

      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-sm text-error font-medium flex items-center gap-1.5">
              <motion.span
                animate={{ x: [0, -3, 3, -3, 3, 0] }}
                transition={{ duration: 0.4, repeat: 1 }}
              >
                <AlertCircle className="w-4 h-4" />
              </motion.span>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};