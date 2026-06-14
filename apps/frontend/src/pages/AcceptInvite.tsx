import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import api from '../lib/axios';
import { Logo } from '../components/ui/Logo';
import { Button, Alert } from '../components/ui';


export const AcceptInvite = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      await api.post('/auth/accept-invite', { token, password, firstName, lastName });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : t('auth.acceptInvite.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return <div className="card text-center text-error">{t('validation.tokenMissing')}</div>;

  if (success) {
    return (
      <div className="card text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h2 className="text-2xl font-bold text-success heading-serif">{t('auth.acceptInvite.successTitle')}</h2>
        <p className="text-text-muted">{t('auth.acceptInvite.successMessage')}</p>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <div className="flex justify-center mb-4">
        <Logo />
      </div>
      <h2 className="text-2xl font-bold text-center text-text-main heading-serif">{t('auth.acceptInvite.title')}</h2>
      <p className="text-center text-text-muted">{t('auth.acceptInvite.subtitle')}</p>
      
      <Alert type="error" message={error || null} variant="inline" />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">{t('auth.common.firstNameLabel')}</label>
            <input 
              type="text" 
              required 
              className="input w-full" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">{t('auth.common.lastNameLabel')}</label>
            <input 
              type="text" 
              required 
              className="input w-full" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium text-text-main mb-1 ${i18n.language === 'ar' ? 'text-right' : ''}`}>{t('auth.common.newPasswordLabel')}</label>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              required 
              minLength={8}
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              className={`input w-full ${i18n.language === 'ar' ? 'pl-11 pr-4' : 'pr-11 pl-4'}`} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors ${i18n.language === 'ar' ? 'left-3' : 'right-3'}`}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? t('auth.acceptInvite.loadingButton') : t('auth.acceptInvite.submitButton')}
        </Button>
      </form>
    </div>
  );
};
