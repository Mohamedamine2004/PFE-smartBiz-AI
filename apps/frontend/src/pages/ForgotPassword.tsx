import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Button, Logo } from '../components/ui';

export const ForgotPassword = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema(t)),
  });

  const onSubmit = async (data: ForgotPasswordInputs) => {
    try {
      setIsLoading(true);
      setApiError(null);
      await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="card text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h2 className="text-2xl font-bold text-text-main heading-serif">{t('auth.forgotPassword.successTitle')}</h2>
        <p className="text-text-muted">{t('auth.forgotPassword.successMessage')}</p>
        <Link to="/login" className="btn-primary w-full mt-4 flex justify-center">{t('auth.common.backToLogin')}</Link>
      </div>
    );
  }

  return (
    <div className="card space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-text-main heading-serif tracking-tight">{t('auth.forgotPassword.title')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('auth.forgotPassword.subtitle')}</p>
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

        <Alert message={apiError} />

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? t('auth.forgotPassword.loadingButton') : t('auth.forgotPassword.submitButton')}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link to="/login" className="font-medium text-text-muted hover:text-text-main transition-colors">{t('auth.forgotPassword.cancelLink')}</Link>
      </div>
    </div>
  );
};