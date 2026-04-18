import { Shield, Lock, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SecuritySection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-brand/5 border-y border-brand/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-brand/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,209,255,0.1)]">
              <Shield className="w-8 h-8 text-brand" />
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">{t('landing.security.items.compliance.title')}</h4>
            <p className="text-sm text-text-muted">{t('landing.security.items.compliance.desc')}</p>
          </div>
          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-success/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(22,163,74,0.1)]">
              <Lock className="w-8 h-8 text-success" />
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">{t('landing.security.items.encryption.title')}</h4>
            <p className="text-sm text-text-muted">{t('landing.security.items.encryption.desc')}</p>
          </div>
          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <Server className="w-8 h-8 text-secondary" />
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">{t('landing.security.items.sovereignty.title')}</h4>
            <p className="text-sm text-text-muted">{t('landing.security.items.sovereignty.desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
