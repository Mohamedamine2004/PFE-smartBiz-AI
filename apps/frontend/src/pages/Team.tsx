import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { TeamTable } from '../components/team/TeamTable';
import type { TeamMember } from '../components/team/TeamTable';
import { InviteForm } from '../components/team/InviteForm';
import { DeleteUserModal } from '../components/team/DeleteUserModal';
import { PageHeader, Alert } from '../components/ui';

export const Team = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feedback state (replaces raw alert())
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

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
    } catch (err: any) {
      setError(err.response?.data?.message || t('team.fetchError', 'Failed to fetch team members'));
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
      setFeedbackType('success');
      setFeedbackMessage(t('team.table.resendSuccess'));
    } catch (err: any) {
      setFeedbackType('error');
      setFeedbackMessage(err.response?.data?.message || t('team.inviteError'));
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
      setFeedbackType('success');
      setFeedbackMessage(t('team.deleteSuccess', 'User removed successfully.'));
      fetchTeam(); // Refresh the list
    } catch (err: any) {
      setFeedbackType('error');
      setFeedbackMessage(err.response?.data?.message || t('team.deleteError', 'Failed to delete user'));
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
