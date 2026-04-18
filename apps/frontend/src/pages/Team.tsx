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
import { PageHeader, Alert } from '../components/ui';
import { InvitationInbox } from '../components/team/InvitationInbox';

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

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/team');
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <PageHeader title={t('team.title')} subtitle={t('team.subtitle')} />
      </div>

      {/* Feedback Alert (replaces native alert()) */}
      {feedbackMessage && (
        <Alert
          type={feedbackType}
          message={feedbackMessage}
          variant="inline"
        />
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          className={`tab-underline ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => handleTabChange('members')}
        >
          {t('team.tabs.members')}
        </button>
        <button
          className={`tab-underline ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => handleTabChange('inbox')}
        >
          {t('team.tabs.inbox')}
        </button>
      </div>

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
          />
        </div>

        {/* Right Side: Invite Form (1/3 Sticky) */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
          <InviteForm onInviteSuccess={fetchTeam} />
        </div>
      </div>
      ) : (
        <InvitationInbox />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        userName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName !== 'attente' ? userToDelete.lastName : ''}` : ''}
        userEmail={userToDelete?.email || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};
