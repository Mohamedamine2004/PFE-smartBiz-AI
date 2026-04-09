import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from './Button'; 
import { financialApi } from '../../lib/financial.service'; 

interface DownloadTemplateButtonProps {
  variant?: 'primary' | 'outline' | 'danger';
  className?: string;
  label?: string;
}

export const DownloadTemplateButton: React.FC<DownloadTemplateButtonProps> = ({ 
  variant = 'outline', 
  className = '',
  label
}) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  // Uses the specific dashboard key you requested
  const buttonLabel = label || t('dashboard.downloadTemplate');

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await financialApi.downloadTemplate();
    } catch (error) {
      console.error('Failed to download the template:', error);
      alert(t('dashboard.downloadError')); 
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleDownload} 
      loading={isDownloading} 
      icon={<Download className="w-4 h-4" />} 
    >
      {isDownloading ? t('dashboard.downloading') : buttonLabel}
    </Button>
  );
};