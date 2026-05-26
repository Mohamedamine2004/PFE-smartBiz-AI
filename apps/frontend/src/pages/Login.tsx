import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { loginSchema, type LoginInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Logo } from '../components/ui';

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema(t)),
  });

  const onSubmit = async (data: LoginInputs) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const result = await login(data.email, data.password);
      toast.success(t('auth.login.success', 'Welcome back!'));
      navigate(result.redirect);
    } catch (error: any) {
      const msg = error.response?.data?.message || t('auth.login.error', 'An error occurred.');
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.97, y: 10 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }} 
      className="card space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-text-main heading-serif tracking-tight">{t('auth.login.title')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('auth.login.subtitle')}</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label={t('auth.common.emailLabel')}
          type="email"
          placeholder={t('auth.common.emailPlaceholder')}
          register={register('email')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <FormInput
          label={t('auth.common.passwordLabel')}
          type="password"
          placeholder={t('auth.common.passwordPlaceholder')}
          register={register('password')}
          error={errors.password?.message}
          disabled={isLoading}
          headerRight={
            <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand/80 transition-colors relative group">
              {t('auth.login.forgotPasswordLink')}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-brand transition-all duration-300 group-hover:w-full" />
            </Link>
          }
        />

        {/* Enhanced error with contextual help */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-error/30 bg-error/5"
          >
            <div className="w-1 h-full min-h-[40px] rounded-full bg-error/60 shrink-0" />
            <div>
              <p className="text-sm font-medium text-error">{apiError}</p>
              {apiError.toLowerCase().includes('password') || apiError.toLowerCase().includes('mot de passe') || apiError.toLowerCase().includes('invalid') ? (
                <Link to="/forgot-password" className="text-xs text-brand hover:underline mt-1 inline-block">
                  → {t('auth.login.forgotPasswordLink')}
                </Link>
              ) : null}
            </div>
          </motion.div>
        )}

        {/* Premium Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className={`relative w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300 overflow-hidden ${
            isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            background: 'linear-gradient(135deg, var(--brand) 0%, #6366F1 100%)',
            boxShadow: '0 4px 20px rgba(0,209,255,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            color: '#fff',
          }}
        >
          {/* Shimmer effect */}
          {!isLoading && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
            />
          )}

          {isLoading ? (
            <>
              {/* Orbital loader */}
              <div className="relative w-5 h-5">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <span className="relative z-10">{t('auth.login.loadingButton')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t('auth.login.submitButton')}</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </>
          )}
        </motion.button>
      </form>

      {/* Footer link */}
      <div className="mt-6 text-center text-sm">
        <span className="text-text-muted">{t('auth.login.noAccount')} </span>
        <Link to="/register" className="font-semibold text-brand hover:text-brand/80 transition-colors relative group">
          {t('auth.login.registerLink')}
          <span className="absolute bottom-0 left-0 w-0 h-px bg-brand transition-all duration-300 group-hover:w-full" />
        </Link>
      </div>
    </motion.div>
  );
};