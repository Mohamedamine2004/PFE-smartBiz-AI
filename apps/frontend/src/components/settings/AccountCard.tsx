import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserCog, ShieldCheck, Eye, EyeOff, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { Alert, ReadOnlyField } from '../ui';
import {
  changePasswordSchema,
  type ChangePasswordInputs,
} from '../../lib/validations';
import { AvatarSelector } from './AvatarSelector';

/* ------------------------------------------------------------------ */
/*  Password Strength Utility                                          */
/* ------------------------------------------------------------------ */

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  glow: string;
  width: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: '', glow: '', width: '0%' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: StrengthResult[] = [
    { score: 0, label: '', color: '', glow: '', width: '0%' },
    { score: 1, label: 'Faible',      color: '#ef4444', glow: 'rgba(239,68,68,0.35)',   width: '25%' },
    { score: 2, label: 'Moyen',       color: '#f97316', glow: 'rgba(249,115,22,0.35)',  width: '50%' },
    { score: 3, label: 'Fort',        color: '#22c55e', glow: 'rgba(34,197,94,0.35)',   width: '75%' },
    { score: 4, label: 'Incassable',  color: '#00D1FF', glow: 'rgba(0,209,255,0.45)',   width: '100%' },
  ];
  return map[score] ?? map[0];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const AccountCard = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordInputs>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue     = form.watch('newPassword');
  const confirmPasswordValue = form.watch('confirmPassword');
  const strength             = getPasswordStrength(newPasswordValue);
  const passwordsMatch       = newPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue;

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
    <div className="relative rounded-3xl p-6 md:p-8 border border-border/50 bg-surface/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] space-y-8">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-secondary/20 bg-secondary/10 text-secondary shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">{t('settings.account.heading')}</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage your personal information and security credentials.</p>
        </div>
      </div>

      {/* Profile Info (ReadOnly) */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 bg-elevated/10 border border-border/30 rounded-2xl p-6">
        <div className="shrink-0">
          <AvatarSelector />
        </div>
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          <ReadOnlyField label={t('auth.common.firstNameLabel')} value={user?.firstName || ''} />
          <ReadOnlyField label={t('auth.common.lastNameLabel')}  value={user?.lastName  || ''} />
          <ReadOnlyField label={t('auth.common.emailLabel')}     value={user?.email     || ''} className="md:col-span-2" />
        </div>
      </div>

      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

      {/* Change Password */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-bold text-text-main tracking-tight">{t('settings.account.changePassword')}</h3>
        </div>

        <form className="space-y-5 max-w-md" onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main block">{t('settings.account.currentPassword')}</label>
            <div className="relative group">
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className={`input w-full pr-11 transition-all duration-300 focus:ring-1 focus:ring-secondary/30 ${
                  form.formState.errors.currentPassword ? 'border-error focus:border-error' : ''
                }`}
                {...form.register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-error font-medium mt-1">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password + Strength Meter */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main block">{t('auth.common.newPasswordLabel')}</label>
            <div className="relative group">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className={`input w-full pr-11 transition-all duration-300 focus:ring-1 focus:ring-secondary/30 ${
                  form.formState.errors.newPassword ? 'border-error focus:border-error' : ''
                }`}
                {...form.register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.formState.errors.newPassword && (
              <p className="text-xs text-error font-medium mt-1">{form.formState.errors.newPassword.message}</p>
            )}

            {/* Neon Strength Gauge */}
            {newPasswordValue.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="flex-1 rounded-full transition-all duration-500"
                      style={{
                        background: strength.score >= seg ? strength.color : 'var(--color-border)',
                        boxShadow: strength.score >= seg ? `0 0 8px ${strength.glow}` : 'none',
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-xs font-bold transition-colors duration-300"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password + Match Indicator */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main block">{t('auth.common.confirmPasswordLabel')}</label>
            <div className="relative group">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className={`input w-full pr-20 transition-all duration-300 focus:ring-1 focus:ring-secondary/30 ${
                  form.formState.errors.confirmPassword ? 'border-error focus:border-error'
                  : passwordsMatch ? 'border-emerald-500/50' : ''
                }`}
                {...form.register('confirmPassword')}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {passwordsMatch && (
                  <CheckCheck
                    className="w-4 h-4 text-emerald-500 animate-scale-in"
                    style={{ animation: 'scaleIn 0.25s ease-out' }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-text-muted hover:text-text-main transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-error font-medium mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Alert type="error"   message={error}   variant="inline" />
          <Alert type="success" message={success} variant="inline" />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-premium group py-3 px-8 text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(to right, var(--secondary), #4f46e5)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : t('settings.account.savePassword')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
