import { Instagram, Linkedin, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import logoLight from '../../assets/logol.svg';
import logoDark from '../../assets/logod.svg';

export const LandingFooter = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src={theme === 'dark' ? logoDark : logoLight} 
                alt="SmartBiz AI" 
                className="h-8 md:h-10 transition-all opacity-80 hover:opacity-100"
              />
            </div>
            <p className="text-text-muted max-w-sm mb-8 leading-relaxed">
              {t('landing.footer.description')}
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-brand hover:border-brand hover:bg-brand/10 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-brand hover:border-brand hover:bg-brand/10 transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-brand hover:border-brand hover:bg-brand/10 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-3 lg:col-span-1">
            <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-xs">
              {t('landing.footer.product.title')}
            </h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.product.benefits')}</a></li>
              <li><a href="#how-it-works" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.product.howItWorks')}</a></li>
              <li><a href="#" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.product.mlModels')}</a></li>
              <li><a href="#pricing" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.product.pricing')}</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3 lg:col-span-1">
            <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-xs">
              {t('landing.footer.company.title')}
            </h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.company.about')}</a></li>
              <li><a href="#" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.company.contact')}</a></li>
              <li><a href="#" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.company.privacy')}</a></li>
              <li><a href="#" className="text-text-muted hover:text-brand transition-colors text-sm font-medium">{t('landing.footer.company.terms')}</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-text-muted text-sm font-medium">
            &copy; {new Date().getFullYear()} {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>{t('landing.footer.operational')}</span>
            </div>
            <span className="hidden sm:inline border-l border-border h-4" />
            <span className="hidden sm:inline">{t('landing.footer.hosted')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
