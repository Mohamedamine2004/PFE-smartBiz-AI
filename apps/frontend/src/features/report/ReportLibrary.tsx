import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCcw, FileText, XCircle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { Button, EmptyState } from '../../components/ui';

interface ReportJob {
  id: string;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  language: string;
  reportTypes: string[];
  pageCount: number | null;
  createdAt: string;
  generatedAt: string | null;
  error: string | null;
}

export const ReportLibrary = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/report/jobs');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load reports', error);
      toast.error(t('reports.library.table.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/report/jobs/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Failed to download report', error);
      toast.error(t('reports.library.table.error.download'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('reports.library.table.deleteConfirm'))) return;
    
    try {
      await api.delete(`/report/jobs/${id}`);
      toast.success(t('reports.library.table.deleteSuccess'));
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report', error);
      toast.error(t('reports.library.table.error.delete'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider">{t('reports.library.status.completed')}</span>;
      case 'PROCESSING':
      case 'QUEUED':
        return <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin"/> {t('reports.library.status.processing')}</span>;
      case 'FAILED':
        return <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider">{t('reports.library.status.failed')}</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-500 text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (!loading && reports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t('reports.library.empty.title')}
        description={t('reports.library.empty.description')}
      />
    );
  }

  return (
    <div className="card !p-0">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50">
        <h3 className="font-semibold text-text-main flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand" /> {t('reports.library.title')}
        </h3>
        <Button variant="ghost" icon={<RefreshCcw className="w-4 h-4"/>} onClick={fetchReports} disabled={loading}>
          {t('reports.library.refresh')}
        </Button>
      </div>
      
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-elevated/20 transition-colors">
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.date')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.sections')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.status')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">{t('reports.library.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-elevated/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-main">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {report.reportTypes.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-elevated border border-white/5 text-text-muted uppercase tracking-wider">{t.replace('_', ' ')}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {getStatusBadge(report.status)}
                   {report.error && <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={report.error}>{report.error}</p>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {report.status === 'COMPLETED' ? (
                      <Button 
                        variant="outline" 
                        onClick={() => handleDownload(report.id)}
                        className="!py-1.5 !px-3 !text-xs !bg-brand/10 !text-brand !border-brand/20 hover:!bg-brand hover:!text-white"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> {t('reports.library.table.download')}
                      </Button>
                    ) : report.status === 'FAILED' ? (
                       <Button variant="ghost" disabled className="!py-1.5 !text-xs !text-red-400">
                         <XCircle className="w-4 h-4" />
                       </Button>
                    ) : (
                      <span className="text-xs text-text-muted animate-pulse mr-2">{t('reports.library.table.processing')}</span>
                    )}
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      title={t('reports.library.table.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {loading && reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                  <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                  <p>{t('reports.library.table.processing')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
