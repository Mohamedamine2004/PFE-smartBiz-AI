import { useTranslation } from 'react-i18next';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';

export const WaitingSetup = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto icon-circle w-16 h-16">
          <Clock className="w-8 h-8 text-brand" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl heading-serif text-text-main">
            {t('waitingSetup.title')}
          </h1>
          <p className="text-helper leading-relaxed">
            {t('waitingSetup.description')}
          </p>
        </div>

        {/* User info badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border border-border text-sm text-text-muted">
          <span>{user?.firstName} {user?.lastName}</span>
          <span className="px-2 py-0.5 bg-brand/10 text-brand rounded text-xs font-medium uppercase">
            {user?.role}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleRefresh} fullWidth icon={<RefreshCw className="w-4 h-4" />}>
            {t('waitingSetup.refresh')}
          </Button>
          <Button variant="danger" onClick={logout} fullWidth icon={<LogOut className="w-4 h-4" />}>
            {t('topbar.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};
