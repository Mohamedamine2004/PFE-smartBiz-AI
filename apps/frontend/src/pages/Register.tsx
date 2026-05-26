import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { CheckCircle2, ArrowRight, ArrowLeft, User, Building2, Shield, Sparkles, Mail } from 'lucide-react';
import { registerSchema, type RegisterInputs } from '../lib/validations';
import { FormInput } from '../components/FormInput';
import { Alert, Logo } from '../components/ui';

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

interface Step {
  key: string;
  icon: React.ElementType;
  titleKey: string;
  color: string;
  glow: string;
}

const STEPS: Step[] = [
  { key: 'identity',  icon: User,     titleKey: 'Identité',     color: '#00D1FF', glow: 'rgba(0,209,255,0.25)' },
  { key: 'company',   icon: Building2, titleKey: 'Entreprise',   color: '#6366F1', glow: 'rgba(99,102,241,0.25)' },
  { key: 'security',  icon: Shield,   titleKey: 'Sécurité',     color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
];

/* ------------------------------------------------------------------ */
/*  Password Strength                                                  */
/* ------------------------------------------------------------------ */

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Faible', color: '#ef4444' },
    { score: 2, label: 'Moyen',  color: '#f97316' },
    { score: 3, label: 'Fort',   color: '#22c55e' },
    { score: 4, label: 'Excellent', color: '#00D1FF' },
  ];
  return map[s] ?? map[0];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, trigger, watch } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema(t)),
    mode: 'onTouched',
  });

  const passwordValue = watch('password') || '';
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  /* Step validation before advancing */
  const handleNext = async () => {
    const fieldsPerStep: (keyof RegisterInputs)[][] = [
      ['firstName', 'lastName'],
      ['companyName', 'registrationNumber'],
      ['email', 'password'],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

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

  /* ── Success Screen ── */
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="card text-center space-y-6"
      >
        <div className="flex justify-center mb-4">
          <Logo />
        </div>

        {/* Animated success ring */}
        <div className="relative mx-auto w-20 h-20">
          {/* Expanding ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.5, 1.8], opacity: [0.6, 0.2, 0] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-success/40"
          />
          {/* Glow circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-2xl font-bold text-text-main heading-serif"
        >
          {t('auth.register.successTitle')}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-success/5 border border-success/20"
        >
          <Mail className="w-5 h-5 text-success shrink-0" />
          <p className="text-sm text-text-muted">{t('auth.register.successMessage')}</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl text-sm font-bold bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all"
        >
          {t('auth.common.backToLogin')}
        </motion.button>
      </motion.div>
    );
  }

  /* ── Registration Wizard ── */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 15 }}
      className="card space-y-7"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-5">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-text-main heading-serif tracking-tight">{t('auth.register.title')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('auth.register.subtitle')}</p>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-3">
        {/* Step pills */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => { if (isDone) setStep(i); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-brand/10 text-brand border border-brand/30'
                      : isDone
                        ? 'bg-success/10 text-success border border-success/20 cursor-pointer hover:bg-success/15'
                        : 'bg-elevated/50 text-text-muted border border-border/30'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.titleKey}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors duration-500 ${
                    isDone ? 'bg-success/40' : 'bg-border/30'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Neon progress bar */}
        <div className="h-1 bg-border/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${STEPS[step].color}, ${step < 2 ? STEPS[step + 1]?.color || STEPS[step].color : STEPS[step].color}80)`,
              boxShadow: `0 0 10px ${STEPS[step].glow}`,
            }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Step 0 — Identity */}
            {step === 0 && (
              <>
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
              </>
            )}

            {/* Step 1 — Company */}
            {step === 1 && (
              <>
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
              </>
            )}

            {/* Step 2 — Security */}
            {step === 2 && (
              <>
                <FormInput
                  label={t('auth.common.emailLabel')}
                  type="email"
                  placeholder={t('auth.common.emailPlaceholder')}
                  register={register('email')}
                  error={errors.email?.message}
                  disabled={isLoading}
                />
                <div>
                  <FormInput
                    label={t('auth.common.passwordLabel')}
                    type="password"
                    placeholder={t('auth.common.passwordPlaceholder')}
                    register={register('password')}
                    error={errors.password?.message}
                    disabled={isLoading}
                  />
                  {/* Strength meter */}
                  {passwordValue.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className="flex-1 rounded-full transition-all duration-500"
                            style={{
                              background: strength.score >= seg ? strength.color : 'var(--color-border)',
                              boxShadow: strength.score >= seg ? `0 0 8px ${strength.color}40` : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <Alert message={apiError} />

        {/* Navigation Buttons */}
        <div className={`flex gap-3 mt-7 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
          {step > 0 && (
            <motion.button
              type="button"
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-border/60 text-text-muted hover:text-text-main hover:border-border hover:bg-elevated/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </motion.button>
          )}

          {step < 2 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${STEPS[step].color}, ${STEPS[step + 1]?.color || STEPS[step].color})`,
                boxShadow: `0 4px 20px ${STEPS[step].glow}`,
              }}
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white overflow-hidden relative transition-all ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              style={{
                background: 'linear-gradient(135deg, #10B981, #00D1FF)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
              }}
            >
              {!isLoading && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
                />
              )}
              {isLoading ? (
                <>
                  <div className="relative w-5 h-5">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <span className="relative z-10">{t('auth.register.loadingButton')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{t('auth.register.submitButton')}</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>

      {/* Footer link */}
      <div className="text-center text-sm pt-2">
        <span className="text-text-muted">{t('auth.register.hasAccount')} </span>
        <Link to="/login" className="font-semibold text-brand hover:text-brand/80 transition-colors relative group">
          {t('auth.register.loginLink')}
          <span className="absolute bottom-0 left-0 w-0 h-px bg-brand transition-all duration-300 group-hover:w-full" />
        </Link>
      </div>
    </motion.div>
  );
};