import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { TeamTable } from '../components/team/TeamTable';
import type { TeamMember } from '../components/team/TeamTable';
import { InviteForm } from '../components/team/InviteForm';
import { DeleteUserModal } from '../components/team/DeleteUserModal';
import { TransferOwnershipModal } from '../components/team/TransferOwnershipModal';
import { PageHeader, Alert } from '../components/ui';
import { InvitationInbox } from '../components/team/InvitationInbox';
import { motion, AnimatePresence } from 'framer-motion';

export const Team = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Tabs state synced with URL
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'members' | 'inbox'>(
    tabParam === 'inbox' ? 'inbox' : 'members'
  );

  useEffect(() => {
    setActiveTab(tabParam === 'inbox' ? 'inbox' : 'members');
  }, [tabParam]);

  const handleTabChange = (tab: 'members' | 'inbox') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/team', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        params: { t: Date.now() }
      });
      setMembers(response.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setError(msg || t('team.fetchError', 'Failed to fetch team members'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleResendInvite = async (email: string, role: string) => {
    try {
      await api.post('/auth/invite', { email, role });
      toast.success(t('team.table.resendSuccess', 'Invitation resent successfully.'));
      setFeedbackType('success');
      setFeedbackMessage(t('team.table.resendSuccess'));
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      const message = msg || t('team.inviteError', 'Failed to resend invitation.');
      toast.error(message);
      setFeedbackType('error');
      setFeedbackMessage(message);
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setUserToDelete(member);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/auth/team/${userToDelete.id}`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      const msg = t('team.deleteSuccess', 'User removed successfully.');
      toast.success(msg);
      setFeedbackType('success');
      setFeedbackMessage(msg);
      fetchTeam(); // Refresh the list
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      const message = msg || t('team.deleteError', 'Failed to delete user');
      toast.error(message);
      setFeedbackType('error');
      setFeedbackMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-8 pb-16">
      {/* Premium Neon Backdrop Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

      <PageHeader title={t('team.title')} subtitle={t('team.subtitle')} />

      {/* Feedback Alert (replaces native alert()) */}
      {feedbackMessage && (
        <Alert
          type={feedbackType}
          message={feedbackMessage}
          variant="inline"
        />
      )}

      {/* Premium Animated Tabs */}
      <div
        className="relative p-1.5 flex gap-1 rounded-2xl bg-surface border border-border/50 self-start w-fit mb-8"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <button
          onClick={() => handleTabChange('members')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
            activeTab === 'members' ? 'text-text-main' : 'text-text-muted hover:text-text-main'
          }`}
        >
          {activeTab === 'members' && (
            <motion.div
              layoutId="teamActiveTab"
              className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {t('team.tabs.members')}
        </button>
        <button
          onClick={() => handleTabChange('inbox')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
            activeTab === 'inbox' ? 'text-text-main' : 'text-text-muted hover:text-text-main'
          }`}
        >
          {activeTab === 'inbox' && (
            <motion.div
              layoutId="teamActiveTab"
              className="absolute inset-0 bg-elevated border border-border/80 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {t('team.tabs.inbox')}
        </button>
      </div>

      {/* Content wrapper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {activeTab === 'members' ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Side: Team Table (2/3) */}
              <div className="w-full lg:w-2/3">
                <TeamTable 
                  members={members}
                  loading={loading}
                  error={error}
                  onResendInvite={handleResendInvite}
                  onDeleteClick={handleDeleteClick}
                  onRefresh={fetchTeam}
                />

                {user?.role === 'OWNER' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500 hover:text-white rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.15)] transition-all active:scale-95 duration-200"
                    >
                      {t('team.transferOwnership', 'Transferer la propriete')}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Invite Form (1/3 Sticky) */}
              <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
                <InviteForm onInviteSuccess={fetchTeam} />
              </div>
            </div>
          ) : (
            <InvitationInbox />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        userName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName !== 'attente' ? userToDelete.lastName : ''}` : ''}
        userEmail={userToDelete?.email || ''}
        isDeleting={isDeleting}
      />

      <TransferOwnershipModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        members={members}
        onSuccess={fetchTeam}
      />
    </div>
  );
};
