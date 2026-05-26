import { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, Crown, Briefcase, Eye, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../../lib/axios';
import { Input } from '../ui';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitationModal = ({ isOpen, onClose }: InvitationModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    role: '',
    message: ''
  });

  // 3D Parallax Tilt Effect for Success Card
  const successCardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = successCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX(-y / 8); // Tilt on X
    setRotateY(x / 8);  // Tilt on Y
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSuccess(false);
      setFormData({
        fullName: '',
        email: '',
        companyName: '',
        role: '',
        message: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (!formData.fullName.trim()) {
      toast.error(t('validation.firstNameRequired', 'Le nom est requis.'));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error(t('validation.emailInvalid', 'E-mail invalide.'));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error(t('invitation.errors.selectRole', 'Veuillez sélectionner un rôle.'));
      return;
    }
    setLoading(true);

    try {
      await api.post('/invitations', formData);
      setSuccess(true);
      toast.success(t('invitation.toasts.success', 'Demande envoyée avec succès !'));
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : t('invitation.toasts.error', 'Une erreur est survenue.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectRole = (roleValue: string) => {
    setFormData({ ...formData, role: roleValue });
  };

  const roleCards = [
    {
      value: 'ADMIN',
      icon: <Crown className="w-6 h-6" />,
      label: t('roles.admin', 'Admin'),
      desc: t('invitation.roles.adminDesc', 'Gestion complète de l\'espace et modèles financiers.'),
      colorClass: 'text-brand bg-brand/5 border-brand/20'
    },
    {
      value: 'COLLAB',
      icon: <Briefcase className="w-6 h-6" />,
      label: t('roles.collaborator', 'Collaborateur'),
      desc: t('invitation.roles.collabDesc', 'Édition des données, predictions et rapports.'),
      colorClass: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
    },
    {
      value: 'READER',
      icon: <Eye className="w-6 h-6" />,
      label: t('roles.reader', 'Lecteur'),
      desc: t('invitation.roles.readerDesc', 'Consultation des indicateurs et exports PDF.'),
      colorClass: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/20'
    }
  ];

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
        className="relative bg-surface/90 backdrop-blur-2xl border border-border/80 shadow-[0_30px_70px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            <h3 className="text-xl font-bold text-text-main" style={{ fontFamily: 'var(--font-display)' }}>
              {success ? t('invitation.success.title', 'Accès Privilégié') : t('invitation.title', 'Demander un Accès')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form funnel */}
        <AnimatePresence mode="wait">
          {success ? (
            /* ── SUCCESS STATE WITH 3D MEMBRSHIP PASS CARD ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="p-8 flex flex-col items-center text-center space-y-8"
            >
              {/* Confettis particles or glow behind */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand/10 pointer-events-none blur-[40px]" />

              <div className="space-y-2 max-w-sm">
                <h4 className="text-2xl font-bold text-text-main" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('invitation.success.title', 'Invitation Enregistrée !')}
                </h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  {t('invitation.success.message', 'Votre demande est en cours d\'examen par notre équipe. Voici votre pass numérique temporaire.')}
                </p>
              </div>

              {/* 3D Glassmorphic Member Pass */}
              <div className="perspective-1000 w-full py-4 flex justify-center">
                <motion.div
                  ref={successCardRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    transformStyle: 'preserve-3d',
                    rotateX: rotateX,
                    rotateY: rotateY,
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="relative w-full max-w-[340px] aspect-[1.58/1] rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 shadow-[0_15px_35px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing"
                >
                  {/* Glowing line overlay */}
                  <div className="absolute inset-0 opacity-[0.15] bg-gradient-to-tr from-brand via-transparent to-secondary" />
                  
                  {/* Decorative mesh */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

                  {/* Pass Header */}
                  <div className="flex justify-between items-start" style={{ transform: 'translateZ(20px)' }}>
                    <div>
                      <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">SmartBiz AI Pass</div>
                      <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Statut : En attente</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand to-secondary flex items-center justify-center text-white font-black text-sm">S</div>
                  </div>

                  {/* Pass Center: User details */}
                  <div className="text-left" style={{ transform: 'translateZ(30px)' }}>
                    <div className="text-base font-bold text-text-main truncate" style={{ fontFamily: 'var(--font-display)' }}>
                      {formData.fullName}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {formData.email}
                    </div>
                  </div>

                  {/* Pass Footer */}
                  <div className="flex justify-between items-end" style={{ transform: 'translateZ(15px)' }}>
                    <div>
                      <span className="text-[8px] font-mono text-text-muted uppercase block">Rôle Demandé</span>
                      <span className="text-[11px] font-bold text-text-main uppercase tracking-wider">
                        {formData.role === 'ADMIN' ? '👑 Admin' : formData.role === 'COLLAB' ? '💼 Collaborateur' : '👁️ Lecteur'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-text-muted">ID: #SB-{Math.floor(1000 + Math.random() * 9000)}</span>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={onClose}
                className="btn-primary w-full py-3.5 text-base rounded-xl mt-4"
              >
                {t('invitation.success.close', 'Fermer la demande')}
              </button>
            </motion.div>
          ) : (
            /* ── ACTIVE FORM STEPS ── */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-mono text-text-muted">Étape {step} sur 2</span>
                <div className="flex gap-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-brand' : 'w-2 bg-border'}`} />
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-brand' : 'w-2 bg-border'}`} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* ── STEP 1: Personal Coordinates ── */
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <Input
                      label={t('invitation.form.fullName', 'Nom Complet')}
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={t('invitation.form.fullNamePlaceholder', 'John Doe')}
                    />

                    <Input
                      label={t('invitation.form.email', 'Adresse E-mail Professionnelle')}
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('invitation.form.emailPlaceholder', 'john@company.com')}
                    />

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn-primary px-8 py-3 rounded-xl text-base flex items-center justify-center gap-2"
                      >
                        <span>{t('wizard.next', 'Suivant')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── STEP 2: Company details & Roles cards ── */
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <Input
                      label={t('invitation.form.company', 'Nom de l\'Entreprise')}
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={t('invitation.form.companyPlaceholder', 'Ma Société SAS')}
                    />

                    {/* Visually stunning Role Choice Cards */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-main/90">
                        {t('invitation.form.role', 'Rôle d\'accès sollicité')}
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {roleCards.map((role) => {
                          const isSelected = formData.role === role.value;
                          return (
                            <button
                              key={role.value}
                              type="button"
                              onClick={() => selectRole(role.value)}
                              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${isSelected ? 'border-brand bg-brand/10 ring-2 ring-brand/20 -translate-y-0.5 shadow-md' : 'border-border/60 bg-surface/40 hover:border-brand/30 hover:bg-surface/80'}`}
                            >
                              <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? 'bg-brand/20 text-brand border-brand/30' : 'bg-elevated/40 text-text-muted border-border/40'}`}>
                                {role.icon}
                              </div>
                              <div className="space-y-1">
                                <span className={`text-sm font-bold block ${isSelected ? 'text-brand' : 'text-text-main'}`}>
                                  {role.label}
                                </span>
                                <span className="text-xs text-text-muted block leading-relaxed pr-2">
                                  {role.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message textarea */}
                    <div>
                      <label className="block text-sm font-semibold text-text-main/90 mb-1.5">
                        {t('invitation.form.message', 'Note optionnelle')}
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t('invitation.form.messagePlaceholder', 'Parlez-nous brièvement de votre entreprise...')}
                        className="input min-h-[80px] py-3 px-4 resize-none rounded-xl"
                      />
                    </div>

                    {/* Nav buttons */}
                    <div className="pt-2 flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-3 border border-border/80 bg-surface/30 hover:bg-elevated/50 text-text-main font-semibold rounded-xl transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('wizard.back', 'Retour')}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 py-3 rounded-xl text-base shadow-[0_4px_25px_rgba(0,209,255,0.25)] flex items-center justify-center gap-2.5"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t('invitation.form.submitting', 'Envoi...')}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{t('invitation.form.submit', 'Envoyer la demande')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
