import { useState, useEffect } from 'react';
import { X, Calendar, Database, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { financialApi } from '../../lib/financial.service';
import toast from 'react-hot-toast';

interface ImportHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeBatchId: string | null;
  onSelectBatch: (batchId: string) => void;
  onBatchDeleted: (deletedBatchId: string) => void;
}

export const ImportHistorySidebar = ({
  isOpen,
  onClose,
  activeBatchId,
  onSelectBatch,
  onBatchDeleted,
}: ImportHistorySidebarProps) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getImportHistory();
      setHistory(data);
    } catch {
      toast.error(t('dashboard.history.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!window.confirm(t('dashboard.history.confirmDeleteDetailed'))) return;
    
    try {
      await financialApi.deleteImportBatch(batchId);
      toast.success(t('dashboard.history.deleteSuccess'));
      setHistory((prev) => prev.filter((item) => item.id !== batchId));
      onBatchDeleted(batchId);
    } catch {
      toast.error(t('dashboard.history.deleteError'));
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 ltr:right-0 rtl:left-0 h-full w-full max-w-md bg-background/95 backdrop-blur-2xl ltr:border-l rtl:border-r border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isOpen ? 'translate-x-0' : 'ltr:translate-x-[110%] rtl:-translate-x-[110%]'
        }`}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-brand/5 to-transparent">
          {/* Header */}
          <div className="relative flex items-center justify-between p-8 border-b border-white/5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-50" />
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-main/70 mb-1">
                {t('dashboard.history.archiveTitle')}
              </h2>
              <p className="text-sm text-text-muted/80 font-medium tracking-wide">
                {t('dashboard.history.archiveSubtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-text-muted hover:text-white bg-surface/50 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-brand gap-4">
                <Spinner />
                <span className="text-sm font-medium animate-pulse text-brand/70">{t('dashboard.history.decrypting')}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('dashboard.history.noHistoricalData')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {history.map((batch, index) => {
                  const isActive = activeBatchId === batch.id || (activeBatchId === null && index === 0);
                  return (
                    <div
                      key={batch.id}
                      className={`relative group overflow-hidden p-5 rounded-2xl border transition-all duration-300 ${
                        isActive
                          ? 'border-brand bg-brand/5 shadow-[0_0_30px_rgba(0,209,255,0.1)]'
                          : 'border-white/5 bg-surface/30 hover:bg-surface/80 hover:border-white/10 hover:shadow-xl'
                      }`}
                    >
                      {/* Accent glow on active */}
                      {isActive && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl flex items-center justify-center ${isActive ? 'bg-brand/20 text-brand' : 'bg-white/5 text-text-muted'}`}>
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block font-bold text-text-main text-[15px]">
                              {t('dashboard.history.snapshot', { number: history.length - index })}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-text-muted font-medium mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(batch.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[#00D1FF] bg-[#00D1FF]/10 px-2.5 py-1 rounded-full border border-[#00D1FF]/20">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1FF] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D1FF]"></span>
                            </span>
                            {t('dashboard.history.active')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-background/50 p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                          <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1">{t('dashboard.history.rowsDigested')}</div>
                          <div className="font-mono text-sm text-text-main font-semibold">
                            {batch.recordCount.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-background/50 p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                          <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1">{t('dashboard.history.integrity')}</div>
                          <div className="font-mono text-sm text-[#10B981] font-semibold flex items-center gap-1.5">
                             <Sparkles className="w-3 h-3" />
                             {t('dashboard.history.verified')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (!isActive) {
                              onSelectBatch(batch.id);
                              onClose();
                            }
                          }}
                          disabled={isActive}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            isActive
                              ? 'bg-transparent text-text-muted cursor-default border border-transparent'
                              : 'bg-white/5 text-text-main hover:bg-brand hover:text-black hover:shadow-[0_0_20px_rgba(0,209,255,0.3)] border border-white/10 hover:border-brand/50'
                          }`}
                        >
                          {isActive ? t('dashboard.history.currentlyAuditing') : t('dashboard.history.auditSnapshot')}
                          {!isActive && <ArrowRight className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="p-2.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                          title={t('dashboard.history.purgeArchive')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Spinner = () => (
  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
);
