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

const statusStyles = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
};

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

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    processed: requests.filter(r => r.status !== 'PENDING').length,
  };

  return (
    <div className="space-y-6 w-full">
      {/* 3-part glass bento statistics strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white transition-all group-hover:scale-105 duration-300 origin-left">{stats.total}</div>
            <div className="text-xs text-text-muted">{t('team.inbox.stats.total', 'Total Demandes')}</div>
          </div>
        </div>
        
        {/* Pending */}
        <div className="bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white transition-all group-hover:scale-105 duration-300 origin-left">{stats.pending}</div>
            <div className="text-xs text-text-muted">{t('team.inbox.stats.pending', 'En Attente')}</div>
          </div>
        </div>
        
        {/* Completed */}
        <div className="bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white transition-all group-hover:scale-105 duration-300 origin-left">{stats.processed}</div>
            <div className="text-xs text-text-muted">{t('team.inbox.stats.processed', 'Traitées')}</div>
          </div>
        </div>
      </div>

      {/* Main Glass container */}
      <div className="bg-white/70 dark:bg-[#0c1220]/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" /> {t('team.inbox.title', "Boîte de réception (Demandes d'accès)")}
            </h3>
            <p className="text-xs text-text-muted mt-1">{t('team.inbox.subtitle', "Gérez les demandes d'invitation provenant de la landing page.")}</p>
          </div>
          <div className="relative w-full sm:w-64 group/search">
            <Search className="w-4 h-4 text-text-muted absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 group-focus-within/search:text-indigo-500 transition-colors duration-300" />
            <input
              type="text"
              placeholder={t('team.inbox.search', "Rechercher...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-[#070b14]/50 border border-slate-200/60 dark:border-white/10 rounded-xl ltr:pl-10 rtl:pr-10 pr-4 py-2.5 text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 transition-all duration-300 shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/10">
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.inbox.date', 'Date')}</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.inbox.user', 'Utilisateur')}</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.inbox.companyRole', 'Entreprise / Rôle')}</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.inbox.message', 'Message')}</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('team.inbox.status', 'Statut')}</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">{t('team.inbox.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>{t('common.loading', 'Chargement...')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    {t('team.inbox.empty', 'Aucune demande trouvée.')}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                    <td className="p-4 whitespace-nowrap text-xs text-text-muted font-medium">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-white text-sm">{req.fullName}</div>
                      <div className="text-xs text-text-muted">{req.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{req.companyName || '-'}</div>
                      <div className="text-xs text-text-muted">{req.role || '-'}</div>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-xs text-slate-600 dark:text-slate-400" title={req.message || ''}>
                      {req.message || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${statusStyles[req.status]}`}>
                        {req.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        {req.status === 'ACCEPTED' && <CheckCircle className="w-3.5 h-3.5" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-[0_4px_12px_rgba(16,185,129,0.15)] transition-all active:scale-95 duration-200"
                            >
                              {t('common.accept', 'Accepter')}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-xs shadow-[0_4px_12px_rgba(244,63,94,0.15)] transition-all active:scale-95 duration-200"
                            >
                              {t('common.reject', 'Rejeter')}
                            </button>
                          </>
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
    </div>
  );
};
