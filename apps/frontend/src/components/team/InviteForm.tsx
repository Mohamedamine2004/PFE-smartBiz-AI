import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';

interface InviteFormProps {
  onInviteSuccess: () => void;
}

export const InviteForm: React.FC<InviteFormProps> = ({ onInviteSuccess }) => {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER' | 'READER'>('USER');
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
      onInviteSuccess(); // Refresh list
    } catch (err: any) {
      setInviteError(err.response?.data?.message || t('team.inviteError'));
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.inviteMember')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('team.inviteDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        {inviteSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {inviteSuccess}
          </div>
        )}
        
        {inviteError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {inviteError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('team.emailLabel')}
          </label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('team.emailPlaceholder')}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('team.roleLabel')}
          </label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'USER' | 'READER')}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
          >
            <option value="USER">{t('team.roleUser')}</option>
            <option value="ADMIN">{t('team.roleAdmin')}</option>
            <option value="READER">{t('team.roleReader')}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={inviteLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {inviteLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('team.sendInvite')}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
