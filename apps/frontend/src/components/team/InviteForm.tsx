import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send } from 'lucide-react';
import axios from 'axios';
import api from '../../lib/axios';
import { Alert, Button } from '../ui';

interface InviteFormProps {
  onInviteSuccess: () => void;
}

export const InviteForm: React.FC<InviteFormProps> = ({ onInviteSuccess }) => {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'COLLAB' | 'READER'>('COLLAB');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess('');
    setInviteError('');

    try {
      await api.post('/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteSuccess(t('team.inviteSuccess'));
      setInviteEmail('');
      onInviteSuccess();
    } catch (err: unknown) {
      setInviteError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || t('team.inviteError')
          : t('team.inviteError')
      );
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-main">{t('team.inviteMember')}</h2>
          <p className="text-sm text-text-muted">{t('team.inviteDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <Alert type="success" message={inviteSuccess} variant="inline" />
        <Alert type="error" message={inviteError} variant="inline" />

        <div>
          <label className="form-label mb-1.5">{t('team.emailLabel')}</label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('team.emailPlaceholder')}
            className="input w-full"
          />
        </div>

        <div>
          <label className="form-label mb-1.5">{t('team.roleLabel')}</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'COLLAB' | 'READER')}
            className="input w-full"
          >
            <option value="COLLAB">{t('team.roleUser')}</option>
            <option value="ADMIN">{t('team.roleAdmin')}</option>
            <option value="READER">{t('team.roleReader')}</option>
          </select>
        </div>

        <Button type="submit" loading={inviteLoading} fullWidth icon={<Send className="w-4 h-4" />}>
          {t('team.sendInvite')}
        </Button>
      </form>
    </div>
  );
};
