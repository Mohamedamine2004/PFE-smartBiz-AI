import React, { useState } from 'react';
import { Crown, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { TeamMember } from './TeamTable';
import { useAuthStore } from '../../store/authStore';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onSuccess: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  onClose,
  members,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  if (!isOpen) return null;

  const eligibleMembers = members.filter(
    (m) => m.role !== 'OWNER' && m.isEmailVerified,
  );

  const handleTransfer = async () => {
    if (!selectedUserId) {
      toast.error(t('team.transferOwnershipModal.selectMember'));
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/team/transfer-ownership', { newOwnerId: selectedUserId });
      const newOwner = members.find((m) => m.id === selectedUserId);
      toast.success(
        t('team.transferOwnershipModal.success', { firstName: newOwner?.firstName, lastName: newOwner?.lastName }),
      );
      await fetchUser();
      onSuccess();
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(msg || t('team.transferOwnershipModal.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('team.transferOwnershipModal.title')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('team.transferOwnershipModal.irreversible')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('team.transferOwnershipModal.warning')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('team.transferOwnershipModal.selectNewOwner')}
            </label>
            {eligibleMembers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {t('team.transferOwnershipModal.noEligible')}
              </p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">{t('team.transferOwnershipModal.selectPlaceholder')}</option>
                {eligibleMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.email}) — {m.role}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleTransfer}
            disabled={isLoading || !selectedUserId || eligibleMembers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Crown className="w-4 h-4" />
            )}
            {t('team.transferOwnershipModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
