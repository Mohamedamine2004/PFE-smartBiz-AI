import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

interface InvitationRequest {
  id: string;
  fullName: string;
  email: string;
  companyName: string | null;
  role: string | null;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export const InvitationInbox = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<InvitationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invitations');
      setRequests(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement des demandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.patch(`/invitations/${id}/status`, { status });
      toast.success(`Demande ${status === 'ACCEPTED' ? 'acceptée' : 'rejetée'} avec succès.`);
      fetchRequests(); // refresh list
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    }
  };

  const filteredRequests = requests.filter(r =>
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.companyName && r.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="card w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand" /> {t('team.inbox.title', "Boîte de réception (Demandes d'accès)")}
          </h3>
          <p className="text-sm text-text-muted mt-1">{t('team.inbox.subtitle', "Gérez les demandes d'invitation provenant de la landing page.")}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('team.inbox.search', "Rechercher...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input ltr:pl-9 rtl:pr-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('team.inbox.date', 'Date')}</th>
              <th>{t('team.inbox.user', 'Utilisateur')}</th>
              <th>{t('team.inbox.companyRole', 'Entreprise / Rôle')}</th>
              <th>{t('team.inbox.message', 'Message')}</th>
              <th>{t('team.inbox.status', 'Statut')}</th>
              <th className="ltr:text-right rtl:text-left">{t('team.inbox.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  Chargement...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-text-muted">
                  {t('team.inbox.empty', 'Aucune demande trouvée.')}
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id}>
                  <td className="whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="font-medium text-text-main">{req.fullName}</div>
                    <div className="text-xs text-text-muted">{req.email}</div>
                  </td>
                  <td>
                    <div className="text-sm text-text-main">{req.companyName || '-'}</div>
                    <div className="text-xs text-text-muted">{req.role || '-'}</div>
                  </td>
                  <td className="max-w-[200px] truncate" title={req.message || ''}>
                    {req.message || '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${req.status === 'PENDING' ? 'warning' :
                        req.status === 'ACCEPTED' ? 'healthy' : 'critical'
                      }`}>
                      {req.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                      {req.status === 'ACCEPTED' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {req.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="ltr:text-right rtl:text-left space-x-2 rtl:space-x-reverse">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                          className="px-3 py-1 bg-success/10 text-success hover:bg-success/20 rounded font-medium text-xs transition-colors"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                          className="px-3 py-1 bg-error/10 text-error hover:bg-error/20 rounded font-medium text-xs transition-colors"
                        >
                          Rejeter
                        </button>
                      </>
                    )}
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
