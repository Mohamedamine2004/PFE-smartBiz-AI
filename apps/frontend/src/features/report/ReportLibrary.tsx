import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Download, 
  RefreshCcw, 
  FileText, 
  XCircle, 
  Clock, 
  Trash2, 
  Eye,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
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
const LENGTH_LABEL: Record<string, string> = { SHORT: 'reports.lengthValues.short', MEDIUM: 'reports.lengthValues.medium', LONG: 'reports.lengthValues.long' };

// Miniature Book Cover for Bento Grid
const MiniatureCover = ({ report }: { report: ReportJob }) => {
  const isFinancial = report.reportTypes.includes('FINANCIAL');
  const isStrategic = report.reportTypes.includes('STRATEGIC');
  const isMarketing = report.reportTypes.includes('MARKETING');
  const isOperational = report.reportTypes.includes('OPERATIONAL');
  
  let bg = 'linear-gradient(135deg, #0e1726 0%, #030712 100%)';
  let accentColor = '#00d1ff';
  
  if (isFinancial) {
    bg = 'radial-gradient(circle at 20% 20%, rgba(0, 209, 255, 0.15) 0%, transparent 60%), linear-gradient(135deg, #0d1e36 0%, #050a14 100%)';
    accentColor = '#00d1ff';
  } else if (isStrategic) {
    bg = 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), linear-gradient(135deg, #1d1b4a 0%, #060b18 100%)';
    accentColor = '#6366f1';
  } else if (isMarketing) {
    bg = 'radial-gradient(circle at 20% 20%, rgba(244, 63, 94, 0.15) 0%, transparent 60%), linear-gradient(135deg, #2d0e2c 0%, #060b18 100%)';
    accentColor = '#f43f5e';
  } else if (isOperational) {
    bg = 'radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.15) 0%, transparent 60%), linear-gradient(135deg, #26190e 0%, #060b18 100%)';
    accentColor = '#fb923c';
  }

  return (
    <div 
      className="rounded-xl border border-white/15 shadow-[0_12px_24px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] shrink-0 select-none flex flex-col justify-between p-3"
      style={{ background: bg, width: '96px', height: '132px' }}
    >
      {/* Book Spine Shadow Overlay */}
      <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-r from-black/35 via-black/15 to-transparent backdrop-blur-[0.5px] shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3)] pointer-events-none" />
      {/* Shiny Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex items-center gap-1 self-end">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
      </div>

      <div className="my-auto pl-1.5 text-left">
        <span 
          className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border pointer-events-none font-mono"
          style={{ 
            color: accentColor, 
            borderColor: `${accentColor}35`,
            background: `${accentColor}12`
          }}
        >
          {report.reportTypes[0]?.replace(/_/g, ' ') || 'RAPPORT'}
        </span>
        <p className="text-[10px] font-black text-white mt-1.5 leading-tight line-clamp-2 font-sans tracking-tight">
          Analyse de Performance
        </p>
      </div>

      <span className="text-[5px] font-mono text-white/40 tracking-widest text-left pl-1.5 font-bold">v1.0 CONFIDENTIEL</span>
    </div>
  );
};

export const ReportLibrary = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  
  // Design View Mode state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
      toast.success(t('reports.library.table.downloadSuccess', 'Téléchargement réussi !'));
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
      if (previewId === id) setPreviewId(null);
    } catch {
      toast.error(t('reports.library.table.error.delete'));
    }
  };

  // Simulated AI active status logging
  const getSimulatedLog = (createdAtStr: string) => {
    const elapsedSecs = (Date.now() - new Date(createdAtStr).getTime()) / 1000;
    if (elapsedSecs < 12) return 'Récupération des indicateurs financiers...';
    if (elapsedSecs < 28) return 'Modélisation des projections financières...';
    if (elapsedSecs < 45) return 'Calcul de la synthèse des risques SWOT...';
    return 'Assemblage final de la mise en page PDF...';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-wider uppercase">Prêt</span>;
      case 'PROCESSING':
      case 'QUEUED':
        return <span className="px-2 py-0.5 rounded-full bg-[#00d1ff]/10 border border-[#00d1ff]/20 text-[#00d1ff] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin" />Génération</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider uppercase">Échec</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-500 text-[10px] font-bold tracking-wider uppercase">{status}</span>;
    }
  };

  if (!loading && reports.length === 0) {
    return <EmptyState icon={FileText} title={t('reports.library.empty.title')} description={t('reports.library.empty.description')} />;
  }

  return (
    <div className="space-y-6">
      {/* Preview Panel Wrapper */}
      {previewId && (
        <ReportPdfViewer
          reportId={previewId}
          onClose={() => setPreviewId(null)}
          className="min-h-[650px] mb-6"
        />
      )}

      {/* Library Container Card */}
      <div className="card !p-0 overflow-hidden border border-border shadow-lg bg-surface/40 backdrop-blur-md">
        {/* Header Controls */}
        <div className="p-4 border-b border-border/60 flex justify-between items-center bg-elevated/30">
          <h3 className="font-bold text-text-main flex items-center gap-2.5 text-base">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand" />
            </div>
            {t('reports.library.title')}
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Sliding view switcher */}
            <div className="flex bg-elevated/40 p-1 rounded-xl border border-border/80 select-none">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-brand text-white shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grille Bento
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' 
                    ? 'bg-brand text-white shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Tableau
              </button>
            </div>

            <Button variant="ghost" icon={<RefreshCcw className="w-3.5 h-3.5" />} onClick={fetchReports} disabled={loading} className="!py-1.5 border border-border/50 hover:bg-elevated">
              {t('reports.library.refresh')}
            </Button>
          </div>
        </div>

        {/* LOADING SHIMMER */}
        {loading && reports.length === 0 ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border/50 rounded-2xl p-5 bg-elevated/10 animate-pulse flex gap-4">
                <div className="w-24 h-[132px] rounded-xl bg-elevated/40 shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-elevated/40 rounded w-3/4" />
                  <div className="h-3 bg-elevated/40 rounded w-1/2" />
                  <div className="h-3 bg-elevated/40 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          /* BENTO GRID VIEW */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const isProcessing = report.status === 'QUEUED' || report.status === 'PROCESSING';
              
              const isFinancial = report.reportTypes.includes('FINANCIAL');
              const isStrategic = report.reportTypes.includes('STRATEGIC');
              const isMarketing = report.reportTypes.includes('MARKETING');
              const isOperational = report.reportTypes.includes('OPERATIONAL');
              
              let hoverShadow = 'hover:shadow-[0_0_30px_rgba(0,209,255,0.08)]';
              let activeBorder = 'hover:border-brand/40';
              if (isStrategic) {
                hoverShadow = 'hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]';
                activeBorder = 'hover:border-secondary/40';
              } else if (isMarketing) {
                hoverShadow = 'hover:shadow-[0_0_30px_rgba(244,63,94,0.08)]';
                activeBorder = 'hover:border-rose-500/40';
              } else if (isOperational) {
                hoverShadow = 'hover:shadow-[0_0_30px_rgba(251,146,60,0.08)]';
                activeBorder = 'hover:border-orange-400/40';
              }

              return (
                <div 
                  key={report.id}
                  className={`group relative border rounded-2xl p-5 flex gap-4 transition-all duration-300 bg-surface/50 hover:-translate-y-1 ${hoverShadow} ${activeBorder} ${
                    previewId === report.id
                      ? 'border-brand shadow-md bg-brand/[0.02]' 
                      : 'border-border/80'
                  }`}
                >
                  {/* Left Side: 3D Booklet Cover */}
                  {report.status === 'FAILED' ? (
                    <div className="w-24 h-[132px] rounded-xl border border-red-500/25 bg-red-500/10 flex flex-col items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <span className="text-[8px] font-bold text-red-500 mt-2 font-mono uppercase">Échec</span>
                    </div>
                  ) : (
                    <MiniatureCover report={report} />
                  )}

                  {/* Right Side: Metadata & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-extrabold text-text-muted font-mono flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-text-muted" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        {getStatusBadge(report.status)}
                      </div>

                      <h4 className="font-extrabold text-sm text-text-main mt-2 group-hover:text-brand transition-colors truncate">
                        {report.reportTypes[0]?.replace(/_/g, ' ') || 'Diagnostic IA'}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-text-muted bg-elevated/40 border border-border/40 px-2 py-0.5 rounded-md">
                          {LANG_FLAG[report.language] ?? report.language} {t(LENGTH_LABEL[report.lengthProfile] ?? report.lengthProfile)}
                        </span>
                        {report.pageCount && (
                          <span className="text-[10px] font-extrabold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(0,209,255,0.05)]">
                            {report.pageCount}p
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pending/Processing state linear loader logs */}
                    {isProcessing && (
                      <div className="mt-3 space-y-1.5">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand to-secondary rounded-full animate-progress-line" style={{ width: '65%' }} />
                        </div>
                        <p className="text-[9px] font-bold text-[#00d1ff] animate-pulse truncate font-mono">
                          {getSimulatedLog(report.createdAt)}
                        </p>
                      </div>
                    )}

                    {/* Action Panel */}
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title={t('reports.library.table.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {report.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewId(previewId === report.id ? null : report.id)}
                            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold border ${
                              previewId === report.id
                                ? 'bg-brand text-white border-brand shadow-sm shadow-brand/15'
                                : 'border-border hover:bg-elevated/50 text-text-muted hover:text-text-main'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Aperçu
                          </button>

                          <button
                            onClick={() => handleDownload(report.id)}
                            className="p-1.5 rounded-lg bg-brand/15 hover:bg-brand hover:text-white text-brand border border-brand/25 hover:border-brand transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm shadow-brand/5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TRADITIONAL TABLE VIEW WITH FADE-IN ACTIONS ON HOVER */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-elevated/35">
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('reports.library.table.date')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('reports.library.table.sections')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Langue / Format</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('reports.library.table.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('reports.library.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-elevated/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="text-sm font-semibold text-text-main">{new Date(report.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{new Date(report.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {report.reportTypes.map((type) => (
                          <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold bg-elevated border border-border/80 text-text-muted uppercase tracking-wide">{type.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                        <span className="text-base leading-none">{LANG_FLAG[report.language] ?? report.language}</span>
                        {t(LENGTH_LABEL[report.lengthProfile] ?? report.lengthProfile)}
                        {report.pageCount ? ` · ${report.pageCount}p` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                      {report.error && <p className="text-[9px] text-red-400 mt-1 max-w-[150px] truncate" title={report.error}>{report.error}</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {/* Interactive Float buttons fade-in on hover only */}
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {report.status === 'COMPLETED' && (
                          <>
                            <button
                              onClick={() => setPreviewId(previewId === report.id ? null : report.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                previewId === report.id 
                                  ? 'bg-brand text-white border-brand shadow-sm shadow-brand/15'
                                  : 'text-text-muted hover:text-brand hover:bg-brand/10 border-transparent'
                              }`}
                              title="Aperçu PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(report.id)}
                              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-all border border-transparent"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {report.status === 'FAILED' && (
                          <span className="p-1.5 text-red-400">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                        {(report.status === 'QUEUED' || report.status === 'PROCESSING') && (
                          <span className="text-xs text-text-muted animate-pulse mr-2">{t('reports.library.table.processing')}</span>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent"
                          title={t('reports.library.table.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
