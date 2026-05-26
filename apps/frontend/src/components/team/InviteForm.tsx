import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, ChevronDown } from 'lucide-react';
import axios from 'axios';
import api from '../../lib/axios';
import { Alert } from '../ui';
import { useAuthStore } from '../../store/authStore';

interface InviteFormProps {
  onInviteSuccess: () => void;
}

export const InviteForm: React.FC<InviteFormProps> = ({ onInviteSuccess }) => {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'COLLAB' | 'READER'>('COLLAB');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const canInviteAdmin = currentUser?.role === 'OWNER';

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
    <div className="bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden group">
      {/* Subtle border lights */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] text-indigo-500">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('team.inviteMember')}</h2>
          <p className="text-xs text-text-muted mt-0.5">{t('team.inviteDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="space-y-5">
        <Alert type="success" message={inviteSuccess} variant="inline" />
        <Alert type="error" message={inviteError} variant="inline" />

        <div className="space-y-2 group/input">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">{t('team.emailLabel')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('team.emailPlaceholder')}
              className="w-full bg-slate-50/50 dark:bg-[#070b14]/50 border border-slate-200/60 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-text-main placeholder-slate-400/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 transition-all duration-300 shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">{t('team.roleLabel')}</label>
          <div className="relative group/select">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'COLLAB' | 'READER')}
              className="w-full bg-slate-50/50 dark:bg-[#070b14]/50 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-main appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 transition-all duration-300 shadow-inner"
            >
              <option value="COLLAB" className="bg-white dark:bg-[#0c1220]">{t('team.roleUser')}</option>
              {canInviteAdmin && <option value="ADMIN" className="bg-white dark:bg-[#0c1220]">{t('team.roleAdmin')}</option>}
              <option value="READER" className="bg-white dark:bg-[#0c1220]">{t('team.roleReader')}</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover/select:rotate-180 text-text-muted" />
          </div>
        </div>

        <button
          type="submit"
          disabled={inviteLoading}
          className="w-full relative group/btn overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98] transition-all duration-200"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 blur-md" />
          <div className="relative flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#0c1220] hover:bg-transparent dark:hover:bg-transparent text-slate-800 dark:text-white hover:text-white dark:hover:text-white rounded-[11px] font-bold text-sm transition-all duration-300">
            {inviteLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            )}
            <span>{t('team.sendInvite')}</span>
          </div>
        </button>
      </form>
    </div>
  );
};
