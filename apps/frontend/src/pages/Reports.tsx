import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui';
import { ReportWizard, ReportLibrary } from '../features/report';

export const Reports = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'wizard' | 'library'>(
    tabParam === 'library' ? 'library' : 'wizard'
  );

  useEffect(() => {
    setActiveTab(tabParam === 'library' ? 'library' : 'wizard');
  }, [tabParam]);

  const handleTabChange = (tab: 'wizard' | 'library') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="page-animate space-y-6">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          className={`tab-underline ${activeTab === 'wizard' ? 'active' : ''}`}
          onClick={() => handleTabChange('wizard')}
        >
          {t('reports.tabs.wizard')}
        </button>
        <button
          className={`tab-underline ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => handleTabChange('library')}
        >
          {t('reports.tabs.library')}
        </button>
      </div>

      {activeTab === 'wizard' ? <ReportWizard /> : <ReportLibrary />}
    </div>
  );
};
