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
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    icon: <Crown className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.owner',
  },
  ADMIN: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
    icon: <Shield className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.admin',
  },
  COLLAB: {
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
    icon: <User className="w-3.5 h-3.5" />,
    labelKey: 'team.roleLabels.collab',
  },
  READER: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
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
    <div className="w-full bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm border-b border-rose-500/20 backdrop-blur-md">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/10">
              <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.table.user')}</th>
              <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.table.role')}</th>
              <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.table.status')}</th>
              <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">{t('team.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>{t('common.loading', 'Chargement...')}</span>
                  </div>
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
                  <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Premium Active-Pulse Avatar with double ring */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
                            member.isEmailVerified 
                              ? 'border-emerald-500/40 animate-[spin_10s_linear_infinite] shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                              : 'border-amber-500/40 animate-[spin_15s_linear_infinite] shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          }`} />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 m-1 border transition-all duration-300 ${
                            member.isEmailVerified
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {member.firstName.charAt(0).toUpperCase()}{member.lastName !== 'attente' && member.lastName ? member.lastName.charAt(0).toUpperCase() : ''}
                          </div>
                          {/* Pulsing indicator dot */}
                          <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0c1220] z-20 ${
                            member.isEmailVerified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                            {member.firstName} {member.lastName !== 'attente' ? member.lastName : ''}
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold uppercase tracking-wider">
                                {t('team.table.you', 'Vous')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge / Dropdown */}
                    <td className="p-4">
                      {canChangeRole ? (
                        <div className="relative inline-block group/select">
                          <select
                            value={member.role}
                            disabled={changingRoleFor === member.id}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                            className={`inline-flex items-center gap-1.5 pl-3.5 pr-8 py-1.5 rounded-full text-xs font-semibold appearance-none cursor-pointer border border-slate-200/50 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 shadow-sm backdrop-blur-md ${roleStyle.badge}`}
                          >
                            {allowedRoles.map((r) => (
                              <option key={r} value={r} className="bg-white dark:bg-[#0c1220] text-slate-800 dark:text-slate-200">
                                {t(ROLE_STYLES[r].labelKey)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover/select:rotate-180 text-current opacity-70" />
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${roleStyle.badge}`}>
                          {roleStyle.icon}
                          {t(roleStyle.labelKey)}
                          {member.role === 'OWNER' && (
                            <span className="ml-1 text-[9px] font-extrabold uppercase tracking-wider opacity-85 px-1 py-0.5 bg-amber-500/20 rounded">
                              Owner
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${
                        member.isEmailVerified
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      }`}>
                        {member.isEmailVerified ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {member.isEmailVerified ? t('team.table.statusActive') : t('team.table.statusPending')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        {!member.isEmailVerified && (
                          <button
                            onClick={() => onResendInvite(member.email, member.role)}
                            className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors uppercase tracking-wider"
                          >
                            {t('team.table.resendInvite')}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDeleteClick(member)}
                            className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all duration-200 active:scale-90"
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
