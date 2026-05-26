import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Building, Lock, Leaf, Gem, Factory, Truck, Package, ShoppingCart, Briefcase, Cpu, Coins, Activity, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { Alert } from '../ui';
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

const SECTOR_ICONS: Record<string, React.ElementType> = {
  agriculture: Leaf,
  mining: Gem,
  construction: Building,
  manufacturing: Factory,
  transport: Truck,
  wholesale: Package,
  retail: ShoppingCart,
  services: Briefcase,
  technology: Cpu,
  finance: Coins,
  health: Activity,
};

const CURRENCY_FLAGS: Record<string, string> = {
  TND: '🇹🇳',
  DZD: '🇩🇿',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  SAR: '🇸🇦',
  AED: '🇦🇪',
  MAD: '🇲🇦',
  CAD: '🇨🇦',
};

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
    <form 
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-border/50 bg-surface/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] space-y-8 animate-fade-in"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-brand/20 bg-brand/10 text-brand shadow-[0_0_20px_rgba(0,209,255,0.15)]">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">{t('settings.company.heading')}</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage your corporate identity and localization settings.</p>
        </div>
      </div>

      {/* ReadOnly Section with Premium Frosted Locked Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-elevated/20 p-4 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('settings.company.name')}</span>
            <div className="text-base font-bold text-text-main">{readOnly.name || '—'}</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.05)]">
            <Lock className="w-3 h-3" />
            <span>Vérifié</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-elevated/20 p-4 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('settings.company.registrationNumber')}</span>
            <div className="text-base font-bold text-text-main">{readOnly.registrationNumber || '—'}</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.05)]">
            <Lock className="w-3 h-3" />
            <span>Verrouillé</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

      {/* Form Fields Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Custom Visual Sector Grid Selector */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span>{t('settings.company.sector')}</span>
            {form.formState.errors.sector && (
              <span className="text-xs text-error font-medium">({form.formState.errors.sector.message})</span>
            )}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
            {SECTORS.map((s) => {
              const Icon = SECTOR_ICONS[s] || Building;
              const isActive = form.watch('sector') === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => form.setValue('sector', s, { shouldValidate: true })}
                  className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all duration-300 gap-2.5 text-left relative overflow-hidden group ${
                    isActive
                      ? 'bg-brand/10 border-brand/50 text-brand shadow-[0_4px_20px_rgba(0,209,255,0.12)] scale-[1.02]'
                      : 'bg-elevated/40 border-border/50 text-text-muted hover:text-text-main hover:bg-elevated/70 hover:border-border hover:scale-[1.01]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-brand/20 text-brand shadow-[0_0_12px_rgba(0,209,255,0.2)]' : 'bg-surface border border-border/50 text-text-muted group-hover:text-text-main'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{t(`settings.company.sectors.${s}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Visual Currency Ribbon */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span>{t('settings.company.currency')}</span>
            {form.formState.errors.currency && (
              <span className="text-xs text-error font-medium">({form.formState.errors.currency.message})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {CURRENCIES.map((c) => {
              const isActive = form.watch('currency') === c;
              const flag = CURRENCY_FLAGS[c] || '🏳️';
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setValue('currency', c, { shouldValidate: true })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand/10 border-brand/50 text-brand shadow-[0_0_12px_rgba(0,209,255,0.12)] scale-[1.02]'
                      : 'bg-elevated/40 border-border/50 text-text-muted hover:text-text-main hover:bg-elevated hover:border-border'
                  }`}
                >
                  <span className="text-base leading-none">{flag}</span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Fiscal Year Month Ribbon */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span>{t('settings.company.fiscalYearStart')}</span>
            {form.formState.errors.fiscalYearStart && (
              <span className="text-xs text-error font-medium">({form.formState.errors.fiscalYearStart.message})</span>
            )}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {MONTHS.map((m) => {
              const isActive = form.watch('fiscalYearStart') === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => form.setValue('fiscalYearStart', m, { shouldValidate: true })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 text-center ${
                    isActive
                      ? 'bg-brand/10 border-brand/50 text-brand shadow-[0_0_12px_rgba(0,209,255,0.12)]'
                      : 'bg-elevated/40 border-border/50 text-text-muted hover:text-text-main hover:bg-elevated/70 hover:border-border'
                  }`}
                >
                  {t(`settings.company.months.${m}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Premium Spotlight Country Field */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-text-main">{t('settings.company.country')}</label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder={t('settings.company.countryPlaceholder')}
              className={`input w-full pl-11 transition-all duration-300 focus:ring-1 focus:ring-brand/30 ${
                form.formState.errors.country ? 'border-error focus:border-error' : ''
              }`}
              {...form.register('country')}
            />
          </div>
          {form.formState.errors.country && (
            <p className="mt-1 text-xs text-error font-medium">{form.formState.errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        <Alert type="error" message={error} variant="inline" />
        <Alert type="success" message={success} variant="inline" />

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-premium group py-3 px-8 text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(0,209,255,0.25)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : t('settings.company.save')}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};
