import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCcw, FileText, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { reportApi } from '../../lib/reportApi';
import { Button, EmptyState } from '../../components/ui';
import { ReportPdfViewer } from './ReportPdfViewer';

interface ReportJob {
  id: string;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  language: string;
  lengthProfile: string;
  reportTypes: string[];
  pageCount: number | null;
  createdAt: string;
  generatedAt: string | null;
  error: string | null;
}

const LANG_FLAG: Record<string, string> = { FR: '🇫🇷', EN: '🇬🇧', AR: '🇸🇦' };
const LENGTH_LABEL: Record<string, string> = { SHORT: 'Court', MEDIUM: 'Moyen', LONG: 'Long' };

export const ReportLibrary = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/report/jobs');
      setReports(res.data);
    } catch {
      toast.error(t('reports.library.table.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchReports(); }, []);

  // Auto-refresh if any report is still processing
  useEffect(() => {
    const hasActive = reports.some((r) => r.status === 'QUEUED' || r.status === 'PROCESSING');
    if (!hasActive) return;
    const id = setInterval(() => void fetchReports(), 4000);
    return () => clearInterval(id);
  }, [reports]);

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/report/jobs/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      toast.error(t('reports.library.table.error.download'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('reports.library.table.deleteConfirm'))) return;
    try {
      await reportApi.delete(id);
      toast.success(t('reports.library.table.deleteSuccess'));
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error(t('reports.library.table.error.delete'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">{t('reports.library.status.completed')}</span>;
      case 'PROCESSING':
      case 'QUEUED':
        return <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold uppercase flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin" />{t('reports.library.status.processing')}</span>;
      case 'FAILED':
        return <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold uppercase">{t('reports.library.status.failed')}</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-500 text-xs font-bold uppercase">{status}</span>;
    }
  };

  if (!loading && reports.length === 0) {
    return <EmptyState icon={FileText} title={t('reports.library.empty.title')} description={t('reports.library.empty.description')} />;
  }

  return (
    <div className="space-y-4">
      {/* Preview Panel */}
      {previewId && (
        <ReportPdfViewer
          reportId={previewId}
          onClose={() => setPreviewId(null)}
          className="min-h-[600px]"
        />
      )}

      <div className="card !p-0">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50">
          <h3 className="font-semibold text-text-main flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />{t('reports.library.title')}
          </h3>
          <Button variant="ghost" icon={<RefreshCcw className="w-4 h-4" />} onClick={fetchReports} disabled={loading}>
            {t('reports.library.refresh')}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-elevated/20">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.date')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.sections')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Langue / Format</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">{t('reports.library.table.status')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">{t('reports.library.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && reports.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded bg-elevated animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-elevated/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="text-sm font-medium text-text-main">{new Date(report.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-text-muted">{new Date(report.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {report.reportTypes.map((type) => (
                          <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold bg-elevated border border-white/5 text-text-muted uppercase">{type.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-muted">
                        {LANG_FLAG[report.language] ?? report.language} {LENGTH_LABEL[report.lengthProfile] ?? report.lengthProfile}
                        {report.pageCount ? ` · ${report.pageCount}p` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                      {report.error && <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={report.error}>{report.error}</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'COMPLETED' && (
                          <>
                            <button
                              onClick={() => setPreviewId(previewId === report.id ? null : report.id)}
                              className="p-1.5 text-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                              title="Aperçu PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Button
                              variant="outline"
                              onClick={() => handleDownload(report.id)}
                              className="!py-1.5 !px-3 !text-xs !bg-brand/10 !text-brand !border-brand/20 hover:!bg-brand hover:!text-white"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />{t('reports.library.table.download')}
                            </Button>
                          </>
                        )}
                        {report.status === 'FAILED' && (
                          <Button variant="ghost" disabled className="!py-1.5 !text-xs !text-red-400">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {(report.status === 'QUEUED' || report.status === 'PROCESSING') && (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
