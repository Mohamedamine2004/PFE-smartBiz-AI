import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { loginSchema, type LoginInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Button, Logo } from '../components/ui';

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
    <div className="card space-y-8">
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
            <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand/80 transition-colors">
              {t('auth.login.forgotPasswordLink')}
            </Link>
          }
        />

        <Alert message={apiError} />

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? t('auth.login.loadingButton') : t('auth.login.submitButton')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-text-muted">{t('auth.login.noAccount')} </span>
        <Link to="/register" className="font-medium text-brand hover:text-brand/80 transition-colors">{t('auth.login.registerLink')}</Link>
      </div>
    </div>
  );
};