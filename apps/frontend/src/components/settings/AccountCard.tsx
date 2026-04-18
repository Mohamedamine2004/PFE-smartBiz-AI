import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../FormInput';
import { Alert, Button, ReadOnlyField } from '../ui';
import {
  changePasswordSchema,
  type ChangePasswordInputs,
} from '../../lib/validations';

export const AccountCard = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<ChangePasswordInputs>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleSubmit = async (data: ChangePasswordInputs) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(t('settings.account.passwordChanged'));
      form.reset();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : t('settings.account.passwordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-6">
        <h2 className="section-heading">{t('settings.account.heading')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadOnlyField label={t('auth.common.firstNameLabel')} value={user?.firstName || ''} />
          <ReadOnlyField label={t('auth.common.lastNameLabel')} value={user?.lastName || ''} />
          <ReadOnlyField label={t('auth.common.emailLabel')} value={user?.email || ''} className="md:col-span-2" />
        </div>

        <hr className="divider" />

        <h3 className="text-base font-medium text-text-main">{t('settings.account.changePassword')}</h3>

        <form className="space-y-4 max-w-md" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormInput
            label={t('settings.account.currentPassword')}
            type="password"
            register={form.register('currentPassword')}
            error={form.formState.errors.currentPassword?.message}
          />
          <FormInput
            label={t('auth.common.newPasswordLabel')}
            type="password"
            register={form.register('newPassword')}
            error={form.formState.errors.newPassword?.message}
          />
          <FormInput
            label={t('auth.common.confirmPasswordLabel')}
            type="password"
            register={form.register('confirmPassword')}
            error={form.formState.errors.confirmPassword?.message}
          />

          <Alert type="error" message={error} variant="inline" />
          <Alert type="success" message={success} variant="inline" />

          <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
            {t('settings.account.savePassword')}
          </Button>
        </form>
      </div>
    </div>
  );
};
