import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Building2, UserCog, AlertCircle, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

// Extracted sub-components
import { CompanyCard } from '../components/settings/CompanyCard';
import { AccountCard } from '../components/settings/AccountCard';
import { PreferencesCard } from '../components/settings/PreferencesCard';
import { WorkspacesCard } from '../components/settings/WorkspacesCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = 'company' | 'account' | 'workspaces';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const Settings = () => {
  const { t } = useTranslation();
  const { user, onboardingComplete } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isOnboarding = !onboardingComplete;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey;

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam === 'account' 
      ? 'account' 
      : tabParam === 'workspaces'
        ? 'workspaces'
        : (tabParam === 'company' && isAdmin) 
          ? 'company' 
          : (isAdmin ? 'company' : 'workspaces')
  );

  useEffect(() => {
    if (tabParam === 'company' || tabParam === 'account' || tabParam === 'workspaces') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const tabs: { key: TabKey; icon: React.ElementType; labelKey: string }[] = isOnboarding
    ? [{ key: 'company', icon: Building2, labelKey: 'settings.tabs.company' }]
    : isAdmin
      ? [
          { key: 'company', icon: Building2, labelKey: 'settings.tabs.company' },
          { key: 'workspaces', icon: Layers, labelKey: 'settings.tabs.workspaces' },
          { key: 'account', icon: UserCog, labelKey: 'settings.tabs.account' },
        ]
      : [
          { key: 'workspaces', icon: Layers, labelKey: 'settings.tabs.workspaces' },
          { key: 'account', icon: UserCog, labelKey: 'settings.tabs.account' },
        ];

  return (
    <div className="relative max-w-4xl mx-auto space-y-8 pb-16">
      {/* Premium Header */}
      <div className="relative mb-10 mt-4">
        {/* Background ambient glow - dynamic based on active tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className={`absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-500 -z-10 ${
              activeTab === 'company' 
                ? 'bg-brand/10 dark:bg-brand/15' 
                : 'bg-secondary/10 dark:bg-secondary/15'
            }`}
          />
        </AnimatePresence>

        <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {t('settings.title')}
        </h1>
        <p className="text-text-muted text-sm">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Onboarding banner */}
      {isOnboarding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl border"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,255,0.1) 0%, rgba(99,102,241,0.05) 100%)',
            borderColor: 'rgba(0,209,255,0.2)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,209,255,0.15)', color: '#00D1FF' }}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-main mb-1 tracking-tight">{t('settings.onboarding.banner')}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{t('settings.onboarding.bannerHint')}</p>
          </div>
        </motion.div>
      )}

      {/* Premium Animated Tabs */}
      <div
        className="relative p-1.5 flex gap-1 rounded-2xl bg-surface border border-border/50 self-start w-fit"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {tabs.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
              activeTab === key ? 'text-text-main' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="settingsActiveTab"
                className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] -z-10"
                transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
              />
            )}
            <Icon className={`w-4 h-4 ${activeTab === key ? 'text-brand' : ''}`} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content wrapper with smooth mounting */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-8"
        >
          {activeTab === 'company' && isAdmin && (
            <CompanyCard isOnboarding={isOnboarding} />
          )}

          {activeTab === 'workspaces' && (
            <WorkspacesCard />
          )}

          {activeTab === 'account' && (
            <div className="grid grid-cols-1 gap-8">
              <AccountCard />
              <PreferencesCard />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
