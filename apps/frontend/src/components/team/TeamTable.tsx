import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, User, CheckCircle, Clock, Eye, Trash2, Users, Crown, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { EmptyState } from '../ui/EmptyState';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import axios from 'axios';

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'COLLAB' | 'READER';
  isEmailVerified: boolean;
  createdAt: string;
}

interface TeamTableProps {
  members: TeamMember[];
  loading: boolean;
  error: string;
  onResendInvite: (email: string, role: string) => void;
  onDeleteClick: (member: TeamMember) => void;
  onRefresh: () => void;
}

const ROLE_STYLES: Record<TeamMember['role'], { badge: string; icon: React.ReactNode; labelKey: string }> = {
  OWNER: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <Crown className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.owner',
  },
  ADMIN: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: <Shield className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.admin',
  },
  COLLAB: {
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: <User className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.collab',
  },
  READER: {
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    icon: <Eye className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.reader',
  },
};

/** Roles that can be selected when changing a member's role */
function getAllowedRolesToAssign(
  currentUserRole: TeamMember['role'],
  targetRole: TeamMember['role'],
): TeamMember['role'][] {
  if (currentUserRole === 'OWNER') {
    // OWNER can assign ADMIN / COLLAB / READER (not OWNER — that's transfer ownership)
    return ['ADMIN', 'COLLAB', 'READER'];
  }
  if (currentUserRole === 'ADMIN' && (targetRole === 'COLLAB' || targetRole === 'READER')) {
    return ['COLLAB', 'READER'];
  }
  return [];
}

export const TeamTable: React.FC<TeamTableProps> = ({
  members,
  loading,
  error,
  onResendInvite,
  onDeleteClick,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: TeamMember['role']) => {
    setChangingRoleFor(memberId);
    try {
      await api.patch(`/auth/team/${memberId}/role`, { role: newRole });
      toast.success(t('team.roleChangeSuccess', `Rôle mis à jour vers ${newRole}.`));
      onRefresh();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(msg || t('team.roleChangeError', 'Impossible de modifier le rôle.'));
    } finally {
      setChangingRoleFor(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border-b border-red-100 dark:border-red-800">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('team.table.user')}</th>
              <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('team.table.role')}</th>
              <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('team.table.status')}</th>
              <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">{t('team.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={t('team.empty.title', 'No team members yet')}
                    description={t('team.empty.description', 'Invite your team members to collaborate on financial analysis and valuations.')}
                  />
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const roleStyle = ROLE_STYLES[member.role];
                const isSelf = currentUser?.id === member.id;
                const allowedRoles = currentUser
                  ? getAllowedRolesToAssign(currentUser.role, member.role)
                  : [];
                const canChangeRole = !isSelf && allowedRoles.length > 0 && member.role !== 'OWNER';
                const canDelete =
                  !isSelf &&
                  member.role !== 'OWNER' &&
                  (currentUser?.role === 'OWNER' ||
                    (currentUser?.role === 'ADMIN' &&
                      (member.role === 'COLLAB' || member.role === 'READER')));

                return (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          member.role === 'OWNER'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {member.firstName.charAt(0)}{member.lastName !== 'attente' ? member.lastName.charAt(0) : ''}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {member.firstName} {member.lastName !== 'attente' ? member.lastName : ''}
                            {isSelf && (
                              <span className="text-xs text-blue-500 font-normal">(Vous)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge / Dropdown */}
                    <td className="p-4">
                      {canChangeRole ? (
                        <div className="relative inline-block">
                          <select
                            value={member.role}
                            disabled={changingRoleFor === member.id}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-7 py-1 rounded-full text-xs font-medium appearance-none cursor-pointer border-0 focus:ring-2 focus:ring-blue-500 ${roleStyle.badge}`}
                          >
                            {allowedRoles.map((r) => (
                              <option key={r} value={r}>
                                {t(ROLE_STYLES[r].labelKey)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleStyle.badge}`}>
                          {roleStyle.icon}
                          {t(roleStyle.labelKey)}
                          {member.role === 'OWNER' && (
                            <span className="ml-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">Owner</span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.isEmailVerified
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {member.isEmailVerified ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {member.isEmailVerified ? t('team.table.statusActive') : t('team.table.statusPending')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!member.isEmailVerified && (
                          <button
                            onClick={() => onResendInvite(member.email, member.role)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            {t('team.table.resendInvite')}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDeleteClick(member)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('team.table.deleteUser', 'Remove User')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
