import { useState } from 'react';
import { X, Send, Loader2, User, Mail, Building2, Briefcase } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    role: '',
    message: ''
  });

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
              icon={<User className="w-4 h-4" />}
            />

            <Input
              label={t('invitation.form.email')}
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={t('invitation.form.emailPlaceholder')}
              icon={<Mail className="w-4 h-4" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('invitation.form.company')}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder={t('invitation.form.companyPlaceholder')}
                icon={<Building2 className="w-4 h-4" />}
              />
              <Input
                label={t('invitation.form.role')}
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder={t('invitation.form.rolePlaceholder')}
                icon={<Briefcase className="w-4 h-4" />}
              />
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
