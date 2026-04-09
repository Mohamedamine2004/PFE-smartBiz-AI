import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, UserCog, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui';

// Extracted sub-components
import { CompanyCard } from '../components/settings/CompanyCard';
import { AccountCard } from '../components/settings/AccountCard';
import { PreferencesCard } from '../components/settings/PreferencesCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = 'company' | 'account';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const Settings = () => {
  const { t } = useTranslation();
  const { user, onboardingComplete } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';
  const isOnboarding = !onboardingComplete;

  const [activeTab, setActiveTab] = useState<TabKey>(isAdmin ? 'company' : 'account');

  const tabs: { key: TabKey; icon: React.ElementType; labelKey: string }[] = isOnboarding
    ? [{ key: 'company', icon: Building2, labelKey: 'settings.tabs.company' }]
    : isAdmin
      ? [
          { key: 'company', icon: Building2, labelKey: 'settings.tabs.company' },
          { key: 'account', icon: UserCog, labelKey: 'settings.tabs.account' },
        ]
      : [{ key: 'account', icon: UserCog, labelKey: 'settings.tabs.account' }];

  return (
    <div className="page-animate space-y-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {/* Onboarding banner */}
      {isOnboarding && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-brand/30 bg-brand/5">
          <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-main">{t('settings.onboarding.banner')}</p>
            <p className="text-helper mt-0.5">{t('settings.onboarding.bannerHint')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`tab-underline ${activeTab === key ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'company' && isAdmin && (
        <CompanyCard isOnboarding={isOnboarding} />
      )}

      {activeTab === 'account' && (
        <>
          <AccountCard />
          <PreferencesCard />
        </>
      )}
    </div>
  );
};
