import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Lock, CheckCircle, ArrowRight, PlusCircle, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { CompanySwitcherModal } from '../CompanySwitcherModal';

export const WorkspacesCard = () => {
  const { t } = useTranslation();
  const { user, myCompanies, fetchMyCompanies } = useAuthStore();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  useEffect(() => {
    fetchMyCompanies();
  }, [fetchMyCompanies]);

  const activeCompany = myCompanies.find((c) => c.companyId === user?.companyId);
  const otherCompanies = myCompanies.filter((c) => c.companyId !== user?.companyId);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-border/50 bg-surface/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] space-y-8 animate-fade-in">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-brand/20 bg-brand/10 text-brand shadow-[0_0_20px_rgba(0,209,255,0.15)]">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-main tracking-tight">
              {t('settings.workspaces.heading', 'Mes Entreprises & Workspaces')}
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              {t('settings.workspaces.subheading', 'Gérez et basculez d’un espace de travail à un autre en toute sécurité.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSwitcherOpen(true)}
          className="btn-premium group py-2.5 px-5 text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(0,209,255,0.15)]"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <Building className="w-4.5 h-4.5" />
            {t('settings.workspaces.switchBtn', 'Basculer d’entreprise')}
          </span>
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-6">
        {/* Active Company Card */}
        {activeCompany && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand uppercase tracking-wider">
              {t('settings.workspaces.activeTitle', 'Workspace Actuel')}
            </h3>
            <div className="relative overflow-hidden rounded-2xl border border-brand/40 bg-brand/5 p-5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand/15 text-brand border border-brand/20">
                  <Building className="w-6 h-6 animate-pulse-subtle" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-main">{activeCompany.companyName}</h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Matricule Fiscal : <span className="font-mono text-text-main font-semibold">{activeCompany.registrationNumber}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Secteur d’activité : <span className="text-brand font-semibold capitalize">{activeCompany.sector || '—'}</span> • Pays : <span className="text-text-main font-semibold">{activeCompany.country || '—'}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/15 text-brand border border-brand/25 text-xs font-bold shadow-inner">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Session Active</span>
                </span>
                <span className="text-[10px] font-bold text-text-muted tracking-wide">
                  Rôle : {activeCompany.role}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

        {/* List of other companies */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            {t('settings.workspaces.otherTitle', 'Autres Entreprises')}
          </h3>

          {otherCompanies.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-surface/10">
              <Building className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
              <p className="text-sm text-text-muted">
                {t('settings.workspaces.noOther', 'Aucune autre entreprise n’est associée à votre compte.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherCompanies.map((c) => (
                <div
                  key={c.companyId}
                  className="relative overflow-hidden rounded-2xl border border-border/50 bg-elevated/10 hover:border-brand/30 hover:bg-elevated/35 transition-all p-5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-elevated/40 text-text-muted group-hover:text-brand group-hover:bg-brand/10 transition-colors border border-border/50">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main group-hover:text-brand transition-colors">
                        {c.companyName}
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Matricule : {c.registrationNumber}
                      </p>
                      <p className="text-[10px] text-brand/80 font-bold mt-1 uppercase tracking-wide">
                        {c.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsSwitcherOpen(true);
                    }}
                    className="p-2 rounded-lg bg-surface hover:bg-brand/15 hover:text-brand border border-border/60 hover:border-brand/40 text-text-muted transition-all"
                    title="Basculer vers cette entreprise"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

        {/* Tip & Creation Card */}
        <div
          className="relative overflow-hidden rounded-2xl border p-5 flex items-start gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,255,0.06) 0%, rgba(99,102,241,0.03) 100%)',
            borderColor: 'rgba(0,209,255,0.15)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-brand/20 bg-brand/10 text-brand">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text-main">
              {t('settings.workspaces.createHeading', 'Créer une nouvelle entreprise ?')}
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Pour ajouter une nouvelle entreprise sous votre compte, il vous suffit de vous rendre sur la page d'inscription et de **créer un compte en utilisant votre même adresse e-mail** mais avec le nom de la nouvelle entreprise. Elle sera instantanément liée à votre profil et apparaîtra ici.
            </p>
          </div>
        </div>
      </div>

      {/* Switcher Modal */}
      <CompanySwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </div>
  );
};
