import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Button, Logo } from '../components/ui';

export const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema(t)),
  });

  const onSubmit = async (data: RegisterInputs) => {
    try {
      setIsLoading(true);
      setApiError(null);
      await api.post('/auth/register', data);
      setIsSuccess(true);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Erreur lors de l\'inscription.');
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
        <h2 className="text-2xl font-bold text-text-main heading-serif">{t('auth.register.successTitle')}</h2>
        <p className="text-text-muted">{t('auth.register.successMessage')}</p>
        <Button onClick={() => navigate('/login')} fullWidth className="mt-4">
          {t('auth.common.backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="card space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-text-main heading-serif tracking-tight">{t('auth.register.title')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('auth.register.subtitle')}</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t('auth.common.firstNameLabel')}
            type="text"
            placeholder={t('auth.common.firstNamePlaceholder')}
            register={register('firstName')}
            error={errors.firstName?.message}
            disabled={isLoading}
          />
          <FormInput
            label={t('auth.common.lastNameLabel')}
            type="text"
            placeholder={t('auth.common.lastNamePlaceholder')}
            register={register('lastName')}
            error={errors.lastName?.message}
            disabled={isLoading}
          />
        </div>

        <FormInput
          label={t('auth.common.companyLabel')}
          type="text"
          placeholder={t('auth.common.companyPlaceholder')}
          register={register('companyName')}
          error={errors.companyName?.message}
          disabled={isLoading}
        />

        <FormInput
          label={t('auth.common.registrationNumberLabel')}
          type="text"
          placeholder={t('auth.common.registrationNumberPlaceholder')}
          register={register('registrationNumber')}
          error={errors.registrationNumber?.message}
          disabled={isLoading}
        />

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
        />

        <Alert message={apiError} />

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? t('auth.register.loadingButton') : t('auth.register.submitButton')}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-text-muted">{t('auth.register.hasAccount')} </span>
        <Link to="/login" className="font-medium text-brand hover:text-brand/80 transition-colors">{t('auth.register.loginLink')}</Link>
      </div>
    </div>
  );
};