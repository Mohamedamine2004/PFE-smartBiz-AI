import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface ReportPdfViewerProps {
  report: {
    id: string;
    reportTypes: string[];
    language: string;
  };
  onClose?: () => void;
  className?: string;
}

export const ReportPdfViewer = ({ report, onClose, className = '' }: ReportPdfViewerProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Custom interactive features
  const [isNightMode, setIsNightMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [dynamicChapters, setDynamicChapters] = useState<{title: string, page: number, desc: string}[]>([]);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!report?.reportTypes) return;
    // Construct dynamic chapters based on report types
    let page = 3;
    const chapters = [
      { title: t('report.chapters.cover', 'Page de Garde'), page: 1, desc: 'Branding & Titre officiel' },
      { title: t('report.chapters.toc', 'Sommaire'), page: 2, desc: 'Table des matières' },
      { title: t('report.chapters.exec', 'Synthèse Exécutive'), page: page++, desc: 'Résumé & Objectifs' },
    ];

    report.reportTypes.forEach((type) => {
      let title = type.replace(/_/g, ' ');
      let desc = 'Analyse détaillée';
      if (type === 'FINANCIAL') { title = 'Analyse Financière'; desc = 'Performance & Métriques'; }
      if (type === 'STRATEGIC') { title = 'Stratégie & Marché'; desc = 'Positionnement & SWOT'; }
      if (type === 'OPERATIONAL') { title = 'Opérations'; desc = 'Processus & Efficacité'; }
      if (type === 'MARKETING') { title = 'Marketing & Ventes'; desc = 'Acquisition & Canaux'; }
      
      chapters.push({ title, page: page++, desc });
    });

    chapters.push({ title: 'Projections IA', page: page++, desc: 'Prédictions & ML' });
    chapters.push({ title: 'Annexes', page: page++, desc: 'Données détaillées' });

    setDynamicChapters(chapters);
  }, [report?.reportTypes, t]);

  useEffect(() => {
    if (!report?.id) return;
    let objectUrl: string | null = null;
    let isMounted = true;

    const fetchPdf = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/report/jobs/${report.id}/preview`, {
          responseType: 'blob',
        });

        if (!isMounted) return;

        objectUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load PDF preview:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [report?.id]);

  const handleChapterClick = (pageNum: number) => {
    setActivePage(pageNum);
    if (pdfUrl) {
      toast.success(t('report.scrollingToPage', { defaultValue: `Défilement vers la page ${pageNum}...`, page: pageNum }), {
        duration: 1000,
        position: 'bottom-center',
        style: {
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#00d1ff',
          border: '1px solid rgba(0, 209, 255, 0.2)',
          fontSize: '11px',
          borderRadius: '20px',
        }
      });
    }
  };

  const handleZoom = (amount: number) => {
    const nextZoom = Math.min(Math.max(zoomLevel + amount, 50), 200);
    setZoomLevel(nextZoom);
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/report/jobs/${report.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${report.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(t('reports.library.table.downloadSuccess', 'Téléchargement réussi !'));
    } catch {
      toast.error(t('reports.library.table.error.download'));
    }
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-slate-950 flex flex-col'
    : `relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.65)] bg-white dark:bg-[#0a0f1d]/90 backdrop-blur-md ${className}`;

  return (
    <div className={containerClass}>
      {/* Premium Toolbar */}
      <div className={`flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-white/10 ${isFullscreen ? 'bg-slate-900' : 'bg-slate-800'} text-white`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg border transition-all ${
              isSidebarOpen 
                ? 'bg-brand/10 border-brand/30 text-brand' 
                : 'border-white/10 hover:bg-white/5 text-slate-300'
            }`}
            title="Table des matières"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-white/10" />

          <p className="text-sm font-semibold flex items-center gap-2 tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00d1ff] animate-pulse shadow-[0_0_10px_rgba(0,209,255,0.8)]" />
            {t('report.pdfPreview', 'Visionneuse de Rapport IA')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Night Mode toggle */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-1.5 rounded-lg border transition-all ${
              isNightMode 
                ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' 
                : 'border-white/10 hover:bg-white/5 text-slate-300'
            }`}
            title={isNightMode ? 'Activer le mode jour' : 'Activer le mode nuit (Confort des yeux)'}
          >
            {isNightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
              title={t('report.openInNewTab', 'Ouvrir dans un nouvel onglet')}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
            title={isFullscreen ? t('report.exitFullscreen', 'Quitter le plein écran') : t('report.fullscreen', 'Plein écran')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors"
              title={t('report.close', 'Fermer')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container splits Sidebar & Iframe */}
      <div className="flex-1 flex relative overflow-hidden bg-slate-100 dark:bg-[#070b13]">
        {/* Retractable Sidebar (Table of Contents) */}
        <aside
          className={`shrink-0 border-r border-slate-200/80 dark:border-white/5 bg-white/50 dark:bg-[#090d16]/75 backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64' : 'w-0 opacity-0 -translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-[#0d1424]/40 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Index du rapport</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {dynamicChapters.map((chapter) => {
              const isActive = activePage === chapter.page;
              return (
                <button
                  key={chapter.page}
                  onClick={() => handleChapterClick(chapter.page)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-start gap-3 border ${
                    isActive
                      ? 'bg-brand/10 border-brand/20 text-text-main shadow-sm'
                      : 'border-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 hover:translate-x-1 text-text-muted'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] ${
                      isActive
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 dark:bg-white/5 text-text-muted'
                    }`}
                  >
                    {chapter.page}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-brand' : 'text-text-main'}`}>
                      {chapter.title}
                    </p>
                    <p className="text-[10px] text-text-muted/75 truncate mt-0.5">{chapter.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* IFrame Viewport Wrapper */}
        <div className="flex-1 flex flex-col relative">
          {/* Loading state */}
          {loading && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl text-center max-w-xs shadow-2xl">
                <Loader2 className="w-10 h-10 animate-spin text-[#00d1ff] mx-auto mb-3" />
                <p className="text-sm font-semibold text-white">{t('report.loadingPdf', 'Chargement du rapport...')}</p>
                <p className="text-xs text-slate-400 mt-1">Génération de la mise en page vectorielle</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white dark:bg-[#0f172a] border border-red-500/20 p-8 rounded-2xl text-center max-w-sm shadow-xl">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-text-main mb-1">{t('report.pdfError', 'Impossible d\'afficher le rapport.')}</p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Une erreur de chargement est survenue. Veuillez rafraîchir la page ou réessayer ultérieurement.
                </p>
              </div>
            </div>
          )}

          {/* PDF iFrame with night mode CSS filter applied */}
          {!loading && !error && pdfUrl && (
            <iframe
              key={`${pdfUrl}-${activePage}-${zoomLevel}`}
              ref={iframeRef}
              src={`${pdfUrl}#page=${activePage}&zoom=${zoomLevel}`}
              title="PDF Report Preview"
              className="flex-1 w-full transition-all duration-300 ease-in-out"
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 48px)' : '650px',
                border: 'none',
                filter: isNightMode ? 'invert(0.9) hue-rotate(180deg) contrast(1.2)' : 'none',
              }}
            />
          )}

          {/* Bottom Floating HUD Capsule Controls */}
          {!loading && !error && pdfUrl && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/90 dark:bg-[#0d1424]/95 text-white border border-slate-700/50 dark:border-white/10 px-5 py-2.5 shadow-2xl backdrop-blur-md rounded-full text-xs animate-fade-in hover:scale-105 transition-transform duration-200">
              <button
                onClick={() => handleZoom(-10)}
                disabled={zoomLevel <= 50}
                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-40"
                title="Zoom arrière"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-[10px] font-mono tracking-widest text-[#00d1ff] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                {zoomLevel}%
              </span>

              <button
                onClick={() => handleZoom(10)}
                disabled={zoomLevel >= 200}
                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-40"
                title="Zoom avant"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3.5 bg-white/15 mx-1" />

              <button
                onClick={() => activePage > 1 && handleChapterClick(activePage - 1)}
                disabled={activePage <= 1}
                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-40"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-semibold px-1 select-none">
                Page <span className="text-[#00d1ff] font-bold font-mono">{activePage}</span> sur <span className="font-mono">{dynamicChapters.length}</span>
              </span>

              <button
                onClick={() => activePage < dynamicChapters.length && handleChapterClick(activePage + 1)}
                disabled={activePage >= dynamicChapters.length}
                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-40"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="w-px h-3.5 bg-white/15 mx-1" />

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1 bg-brand hover:bg-brand-hover text-white font-bold rounded-full transition-colors text-[10px] uppercase tracking-wider"
                title="Télécharger le PDF"
              >
                <Download className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

