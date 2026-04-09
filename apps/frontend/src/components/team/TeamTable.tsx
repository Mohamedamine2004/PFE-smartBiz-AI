import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, User, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'READER';
  isEmailVerified: boolean;
  createdAt: string;
}

interface TeamTableProps {
  members: TeamMember[];
  loading: boolean;
  error: string;
  onResendInvite: (email: string, role: string) => void;
  onDeleteClick: (member: TeamMember) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  members,
  loading,
  error,
  onResendInvite,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();

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
                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {t('team.table.noMembers')}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        {member.firstName.charAt(0)}{member.lastName !== 'attente' ? member.lastName.charAt(0) : ''}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {member.firstName} {member.lastName !== 'attente' ? member.lastName : ''}
                          {currentUser?.id === member.id && (
                            <span className="text-xs text-blue-500 font-normal">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : member.role === 'READER'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {member.role === 'ADMIN' && <Shield className="w-3.5 h-3.5" />}
                      {member.role === 'USER' && <User className="w-3.5 h-3.5" />}
                      {member.role === 'READER' && <Eye className="w-3.5 h-3.5" />}
                      
                      {member.role === 'ADMIN' && t('team.roleAdmin')}
                      {member.role === 'USER' && t('team.roleUser')}
                      {member.role === 'READER' && t('team.roleReader')}
                    </span>
                  </td>
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
                      
                      {/* Delete Button - Only show if current user is admin, and not deleting themselves */}
                      {currentUser?.role === 'ADMIN' && currentUser.id !== member.id && (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
