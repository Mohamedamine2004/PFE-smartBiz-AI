import { useEffect, useState } from 'react';
import { X, Building, KeyRound, Loader2, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface CompanySwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySwitcherModal = ({ isOpen, onClose }: CompanySwitcherModalProps) => {
  const { t } = useTranslation();
  const { user, myCompanies, fetchMyCompanies, switchCompany } = useAuthStore();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyCompanies();
      setSelectedCompanyId(null);
      setPassword('');
      setShowPasswordInput(false);
    }
  }, [isOpen, fetchMyCompanies]);

  if (!isOpen) return null;

  const handleSelectCompany = (companyId: string) => {
    if (companyId === user?.companyId) {
      toast.error(t('settings.switcher.alreadyActive', 'Cette entreprise est déjà active.'));
      return;
    }
    setSelectedCompanyId(companyId);
    setPassword('');
    setShowPasswordInput(true);
  };

  const handleBack = () => {
    setShowPasswordInput(false);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    if (!password.trim()) {
      toast.error(t('validation.passwordRequired', 'Le mot de passe est requis.'));
      return;
    }

    setLoading(true);
    try {
      await switchCompany(selectedCompanyId, password);
      toast.success(t('settings.switcher.success', 'Basculement d’entreprise réussi !'));
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || t('settings.switcher.error', 'Une erreur est survenue lors du basculement.');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const activeMembership = myCompanies.find((c) => c.companyId === user?.companyId);
  const otherCompanies = myCompanies.filter((c) => c.companyId !== user?.companyId);
  const targetCompany = myCompanies.find((c) => c.companyId === selectedCompanyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative bg-surface/90 backdrop-blur-2xl border border-border/80 shadow-[0_30px_70px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-md overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-brand" />
            <h3 className="text-xl font-bold text-text-main" style={{ fontFamily: 'var(--font-display)' }}>
              {t('settings.switcher.title', 'Changer d\'entreprise')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showPasswordInput ? (
            /* ── STEP 1: SELECT COMPANY ── */
            <motion.div
              key="select-company"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-6"
            >
              {/* Active Company Card */}
              {activeMembership && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                    {t('settings.switcher.activeCompany', 'Entreprise Active')}
                  </span>
                  <div className="w-full flex items-center justify-between p-4 rounded-xl border border-brand/30 bg-brand/5 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold text-text-main block">
                          {activeMembership.companyName}
                        </span>
                        <span className="text-xs text-text-muted block">
                          {activeMembership.registrationNumber} • Rôle : {activeMembership.role}
                        </span>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-brand shrink-0" />
                  </div>
                </div>
              )}

              {/* Other Companies List */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  {t('settings.switcher.otherCompanies', 'Vos autres Espaces de Travail')}
                </span>
                
                {otherCompanies.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border/60 rounded-xl">
                    <p className="text-xs text-text-muted">
                      {t('settings.switcher.noOther', 'Aucune autre entreprise associée à votre compte.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {otherCompanies.map((c) => (
                      <button
                        key={c.companyId}
                        onClick={() => handleSelectCompany(c.companyId)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-surface/30 hover:border-brand/40 hover:bg-surface/80 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-elevated/40 text-text-muted group-hover:text-brand group-hover:bg-brand/10 transition-colors border border-border/40">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-text-main block group-hover:text-brand transition-colors">
                              {c.companyName}
                            </span>
                            <span className="text-xs text-text-muted block">
                              {c.registrationNumber} • {c.role}
                            </span>
                          </div>
                        </div>
                        <Lock className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ── STEP 2: PASSWORD VERIFICATION ── */
            <motion.form
              key="password-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20 shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-text-main">
                  {t('settings.switcher.verifyPassword', 'Sécurité requise')}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed px-4">
                  {t(
                    'settings.switcher.verifyDesc',
                    'Veuillez entrer le mot de passe associé à l\'entreprise'
                  )}{' '}
                  <strong className="text-brand font-bold">{targetCompany?.companyName}</strong>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                  {t('fields.password', 'Mot de passe de l\'entreprise')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full py-3.5 px-4 rounded-xl border border-border/80 bg-surface/40 focus:border-brand outline-none focus:ring-1 focus:ring-brand/35 text-center text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 border border-border/80 bg-surface/30 hover:bg-elevated/50 text-text-main font-semibold rounded-xl transition-all"
                >
                  {t('wizard.back', 'Retour')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-3 rounded-xl text-base shadow-[0_4px_25px_rgba(0,209,255,0.25)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('settings.switcher.switching', 'Action...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('settings.switcher.confirm', 'Valider')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
