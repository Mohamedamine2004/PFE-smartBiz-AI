import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../FormInput';
import { Alert, Button, FormSelect, ReadOnlyField } from '../ui';
import {
  companyProfileSchema,
  type CompanyProfileInputs,
} from '../../lib/validations';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SECTORS = [
  'agriculture', 'mining', 'construction', 'manufacturing',
  'transport', 'wholesale', 'retail', 'services', 'technology',
  'finance', 'health',
];

const CURRENCIES = ['TND', 'DZD', 'USD', 'EUR', 'GBP', 'SAR', 'AED', 'MAD', 'CAD'];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CompanyCardProps {
  isOnboarding: boolean;
}

export const CompanyCard = ({ isOnboarding }: CompanyCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCompanyStatus } = useAuthStore();

  const [readOnly, setReadOnly] = useState({ name: '', registrationNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<CompanyProfileInputs>({
    resolver: zodResolver(companyProfileSchema(t)),
    defaultValues: { sector: '', currency: 'TND', fiscalYearStart: 1, country: 'Tunisie' },
  });

  /* Load existing profile */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/company/profile');
        setReadOnly({
          name: data.name || '',
          registrationNumber: data.registrationNumber || '',
        });
        form.reset({
          sector: data.sector || '',
          currency: data.currency || 'TND',
          fiscalYearStart: data.fiscalYearStart || 1,
          country: data.country || 'Tunisie',
        });
      } catch {
        // first-time setup — fields are empty
      }
    })();
  }, []);

  /* Save */
  const handleSubmit = async (data: CompanyProfileInputs) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.put('/company/profile', data);
      const { data: me } = await api.get('/auth/me');
      setCompanyStatus(me.onboardingComplete ?? true, me.hasFinancialData ?? false);
      setSuccess(t('settings.company.saveSuccess'));

      if (isOnboarding) {
        setTimeout(() => navigate('/dashboard', { replace: true }), 800);
      }
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : t('settings.company.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <h2 className="section-heading">{t('settings.company.heading')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadOnlyField label={t('settings.company.name')} value={readOnly.name} />
        <ReadOnlyField label={t('settings.company.registrationNumber')} value={readOnly.registrationNumber} />
      </div>

      <hr className="divider" />

      <FormSelect
        label={t('settings.company.sector')}
        placeholder={t('settings.company.selectSector')}
        register={form.register('sector')}
        error={form.formState.errors.sector?.message}
        options={SECTORS.map((s) => ({ value: s, label: t(`settings.company.sectors.${s}`) }))}
      />

      <FormSelect
        label={t('settings.company.currency')}
        register={form.register('currency')}
        error={form.formState.errors.currency?.message}
        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
      />

      <div className="space-y-1.5">
        <label className="form-label">{t('settings.company.fiscalYearStart')}</label>
        <select
          className={`input w-full ${form.formState.errors.fiscalYearStart ? 'border-error focus:border-error' : ''}`}
          value={form.watch('fiscalYearStart')}
          onChange={(e) => form.setValue('fiscalYearStart', Number(e.target.value), { shouldValidate: true })}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{t(`settings.company.months.${m}`)}</option>
          ))}
        </select>
        {form.formState.errors.fiscalYearStart && (
          <p className="mt-1.5 text-sm text-error font-medium">{form.formState.errors.fiscalYearStart.message}</p>
        )}
      </div>

      <FormInput
        label={t('settings.company.country')}
        type="text"
        placeholder={t('settings.company.countryPlaceholder')}
        register={form.register('country')}
        error={form.formState.errors.country?.message}
      />

      <Alert type="error" message={error} variant="inline" />
      <Alert type="success" message={success} variant="inline" />

      <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
        {t('settings.company.save')}
      </Button>
    </form>
  );
};
