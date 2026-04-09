import { useTranslation } from 'react-i18next';
import { BarChart3, Upload, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

interface DashboardEmptyStateProps {
  onNavigateImport: () => void;
  onNavigateSettings: () => void;
}

export const DashboardEmptyState = ({
  onNavigateImport,
  onNavigateSettings,
}: DashboardEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-brand" />
      </div>
      <h2 className="text-xl font-medium text-text-main mb-2">
        {t('dashboard.empty.title')}
      </h2>
      <p className="text-sm text-text-muted max-w-md mb-8">
        {t('dashboard.empty.description')}
      </p>
      <div className="flex gap-3">
        <Button onClick={onNavigateImport} icon={<Upload className="w-4 h-4" />}>
          {t('dashboard.empty.importBtn')}
        </Button>
        <Button variant="outline" onClick={onNavigateSettings} icon={<Settings className="w-4 h-4" />}>
          {t('dashboard.empty.settingsBtn')}
        </Button>
      </div>
    </div>
  );
};
