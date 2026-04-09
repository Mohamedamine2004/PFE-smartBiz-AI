import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Button, Logo } from '../components/ui';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema(t)),
  });

  if (!token) {
    return (
      <div className="card text-center border-error/30">
        <AlertCircle className="mx-auto h-12 w-12 text-error mb-4" />
        <h2 className="text-xl font-bold text-error">{t('validation.tokenMissing')}</h2>
        <Link to="/login" className="btn-primary w-full mt-6 flex justify-center">{t('auth.common.backToLogin')}</Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordInputs) => {
    try {
      setIsLoading(true);
      setApiError(null);
      await api.post('/auth/reset-password', { token, newPassword: data.password });
      setIsSuccess(true);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Erreur lors de la réinitialisation.');
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
        <h2 className="text-2xl font-bold text-text-main heading-serif">{t('auth.resetPassword.successTitle')}</h2>
        <Button onClick={() => navigate('/login')} fullWidth className="mt-4">
          {t('auth.common.backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="card space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-text-main heading-serif">{t('auth.resetPassword.title')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('auth.resetPassword.subtitle')}</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label={t('auth.common.newPasswordLabel')}
          type="password"
          register={register('password')}
          error={errors.password?.message}
          disabled={isLoading}
        />

        <FormInput
          label={t('auth.common.confirmPasswordLabel')}
          type="password"
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />

        <Alert message={apiError} />

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? t('auth.resetPassword.loadingButton') : t('auth.resetPassword.submitButton')}
        </Button>
      </form>
    </div>
  );
};