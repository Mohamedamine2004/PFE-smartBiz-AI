import { useTranslation } from 'react-i18next';
import { Upload, ClipboardList } from 'lucide-react';
import { Button } from '../ui/Button';

interface DashboardHeaderProps {
  userName: string;
  importCount: number;
  onToggleHistory: () => void;
  onNavigateImport: () => void;
}

const getGreetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
};

export const DashboardHeader = ({
  userName,
  importCount,
  onToggleHistory,
  onNavigateImport,
}: DashboardHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold text-text-main tracking-tight">
          {t(getGreetingKey(), { name: userName })}
        </h1>
        <p className="text-helper mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onToggleHistory} className="action-btn">
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.historyBtn')}</span>
          {importCount > 0 && (
            <span className="badge-count animate-in zoom-in duration-300">
              {importCount}
            </span>
          )}
        </button>

        <Button
          variant="outline"
          onClick={onNavigateImport}
          icon={<Upload className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">{t('dashboard.importBtn')}</span>
        </Button>
      </div>
    </div>
  );
};
