import { z } from 'zod';
import type { TFunction } from 'i18next';

/* ------------------------------------------------------------------ */
/*  Factory functions (schemas depend on translated messages)          */
/* ------------------------------------------------------------------ */

export const loginSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

export const registerSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    companyName: z.string().min(1, t('validation.companyRequired')),
    registrationNumber: z.string().min(1, t('validation.registrationNumberRequired')),
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordMin')),
  });

export const forgotPasswordSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
  });

export const resetPasswordSchema = (t: TFunction) =>
  z
    .object({
      password: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

export const companyProfileSchema = (t: TFunction) =>
  z.object({
    sector: z.string().min(1, t('settings.company.requiredFields')),
    currency: z.string().min(1, t('settings.company.requiredFields')),
    fiscalYearStart: z.number().min(1).max(12),
    country: z.string().optional(),
  });

export const changePasswordSchema = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t('validation.passwordRequired')),
      newPassword: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

/* ------------------------------------------------------------------ */
/*  Inferred types                                                     */
/* ------------------------------------------------------------------ */

export type LoginInputs = z.infer<ReturnType<typeof loginSchema>>;
export type RegisterInputs = z.infer<ReturnType<typeof registerSchema>>;
export type ForgotPasswordInputs = z.infer<ReturnType<typeof forgotPasswordSchema>>;
export type ResetPasswordInputs = z.infer<ReturnType<typeof resetPasswordSchema>>;
export type CompanyProfileInputs = z.infer<ReturnType<typeof companyProfileSchema>>;
export type ChangePasswordInputs = z.infer<ReturnType<typeof changePasswordSchema>>;
