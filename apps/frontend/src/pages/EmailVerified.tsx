import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Logo, Button } from '../components/ui';

export const EmailVerified = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  return (
    <div className="card text-center space-y-6">
      <div className="flex justify-center mb-4">
        <Logo />
      </div>
      {status === 'success' ? (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h2 className="text-2xl font-bold text-text-main heading-serif">
            {t('auth.emailVerified.successTitle')}
          </h2>
          <p className="text-text-muted">
            {t('auth.emailVerified.successMessage')}
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-16 w-16 text-error" />
          <h2 className="text-2xl font-bold text-text-main heading-serif">
            {t('auth.emailVerified.errorTitle')}
          </h2>
          <p className="text-text-muted">
            {t('auth.emailVerified.errorMessage')}
          </p>
        </>
      )}
      
      <Link to="/login">
        <Button fullWidth className="mt-4">
          {t('auth.common.backToLogin')}
        </Button>
      </Link>
    </div>
  );
};