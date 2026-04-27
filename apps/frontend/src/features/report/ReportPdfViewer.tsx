import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ExternalLink, X, Maximize2 } from 'lucide-react';
import api from '../../lib/axios';

interface ReportPdfViewerProps {
  reportId: string;
  onClose?: () => void;
  className?: string;
}

export const ReportPdfViewer = ({ reportId, onClose, className = '' }: ReportPdfViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const fetchPdf = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/report/jobs/${reportId}/preview`, {
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
  }, [reportId]);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-black/90 flex flex-col'
    : `relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-xl ${className}`;

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 ${isFullscreen ? 'bg-slate-900' : 'bg-slate-800'} text-white`}>
        <p className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Aperçu du rapport
        </p>
        <div className="flex items-center gap-2">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && !error && (
        <div className="absolute inset-0 top-10 z-10 flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Chargement du PDF...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">Impossible d'afficher le PDF.</p>
          </div>
        </div>
      )}

      {/* PDF iFrame */}
      {!loading && !error && pdfUrl && (
        <iframe
          src={pdfUrl}
          title="PDF Report Preview"
          className="flex-1 w-full"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 44px)' : '600px', border: 'none' }}
        />
      )}
    </div>
  );
};
