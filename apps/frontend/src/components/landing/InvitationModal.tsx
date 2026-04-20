import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const [roleOpen, setRoleOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    role: '',
    message: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setRoleOpen(false);
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRoleOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/invitations', formData);
      setSuccess(true);
      toast.success(t('invitation.toasts.success'));
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) 
        ? err.response?.data?.message 
        : t('invitation.toasts.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const roleOptions = [
    { value: 'ADMIN', label: t('roles.admin', 'Admin') },
    { value: 'COLLAB', label: t('roles.collaborator', 'Collaborateur') },
    { value: 'READER', label: t('roles.reader', 'Lecteur') },
  ];

  const selectedRoleLabel = roleOptions.find((option) => option.value === formData.role)?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-fade-scale">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-text-main">
            {t('invitation.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-success" />
            </div>
            <h4 className="text-2xl font-bold text-text-main mb-2">
              {t('invitation.success.title')}
            </h4>
            <p className="text-text-muted mb-6 leading-relaxed">
              {t('invitation.success.message')}
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full py-4 text-base"
            >
              {t('invitation.success.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Input
              label={t('invitation.form.fullName')}
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('invitation.form.fullNamePlaceholder')}
            />

            <Input
              label={t('invitation.form.email')}
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={t('invitation.form.emailPlaceholder')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('invitation.form.company')}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder={t('invitation.form.companyPlaceholder')}
              />
              <div className="relative space-y-1.5 w-full" ref={roleMenuRef}>
                <label className="block text-sm font-semibold text-text-main/90 mb-1.5">
                  {t('invitation.form.role')}
                </label>
                <button
                  type="button"
                  onClick={() => setRoleOpen((open) => !open)}
                  className="input w-full px-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={roleOpen}
                >
                  <span className={formData.role ? 'text-text-main' : 'text-text-muted'}>
                    {selectedRoleLabel ?? t('invitation.form.rolePlaceholder')}
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${roleOpen ? 'rotate-180' : ''}`} />
                </button>

                {roleOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="max-h-56 overflow-auto py-1" role="listbox">
                      {roleOptions.map((option) => {
                        const isSelected = formData.role === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setFormData({ ...formData, role: option.value });
                              setRoleOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${isSelected ? 'bg-brand/10 text-brand' : 'text-text-main hover:bg-elevated'}`}
                          >
                            <span>{option.label}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main/90 mb-1.5">
                {t('invitation.form.message')}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t('invitation.form.messagePlaceholder')}
                className="input min-h-[100px] py-3 px-4 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg shadow-[0_4px_20px_rgba(0,209,255,0.2)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('invitation.form.submitting')}</span>
                  </>
                ) : (
                  <span>{t('invitation.form.submit')}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
