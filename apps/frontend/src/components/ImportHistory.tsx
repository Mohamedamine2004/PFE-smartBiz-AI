import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2, Package, Calendar, Hash } from 'lucide-react';
import { financialApi } from '../lib/financial.service';
import { formatNumber, getRelativeDate } from '../lib/formatters';
import type { ImportBatch } from '../types/dashboard';


interface ImportHistoryProps {
  onBatchDeleted?: () => void;
  onBatchSelect?: (batchId: string) => void;
  activeBatchId?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ImportHistory = ({ onBatchDeleted, onBatchSelect, activeBatchId }: ImportHistoryProps) => {
  const { t } = useTranslation();

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ---- Fetch history ---- */
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financialApi.getImportHistory();
      setBatches(data);
    } catch {
      setError(t('dashboard.history.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  /* ---- Delete handler ---- */
  const handleDelete = async (batchId: string) => {
    try {
      setDeletingId(batchId);
      await financialApi.deleteImportBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      setConfirmDeleteId(null);
      onBatchDeleted?.();
    } catch {
      setError(t('dashboard.history.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="p-6">
      {/* Loading */}
      {loading && (
        <div className="loading-center">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-box mb-4">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && batches.length === 0 && (
        <div className="empty-state">
          <Package className="w-10 h-10 text-text-muted/30 mb-3" />
          <p className="text-helper">{t('dashboard.history.empty')}</p>
          <p className="text-xs text-text-muted/70 mt-1">{t('dashboard.history.emptyHint')}</p>
        </div>
      )}

      {/* Batch list (card-based for drawer) */}
      {!loading && batches.length > 0 && (
        <div className="space-y-3">
          {batches.map((batch, index) => (
            <div
              key={batch.id}
              onClick={() => onBatchSelect?.(batch.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                activeBatchId === batch.id
                  ? 'border-brand bg-brand/[0.05] hover:border-brand/40'
                  : 'border-border bg-surface hover:border-brand/20'
              } ${
                index === 0 && activeBatchId !== batch.id
                  ? 'border-brand/20 bg-brand/[0.02]'
                  : ''
              }`}
            >
              {/* Row 1: Date + delete */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {index === 0 && activeBatchId !== batch.id && (
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  )}
                  {activeBatchId === batch.id && (
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  )}
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-sm font-medium text-text-main">
                    {getRelativeDate(batch.createdAt, t)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(batch.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {activeBatchId === batch.id && (
                    <span className="ml-2 text-xs font-medium text-brand bg-brand/10 px-2 py-1 rounded">
                      {t('dashboard.history.active')}
                    </span>
                  )}
                </div>

                {/* Delete action */}
                {confirmDeleteId === batch.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('dashboard.history.confirmDelete')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(batch.id);
                      }}
                      disabled={!!deletingId}
                      className="px-2 py-0.5 text-xs font-medium bg-error text-white rounded-md hover:bg-error/90 transition-colors disabled:opacity-50"
                    >
                      {deletingId === batch.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        t('dashboard.history.yes')
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="px-2 py-0.5 text-xs font-medium border border-border text-text-muted rounded-md hover:text-text-main transition-colors"
                    >
                      {t('dashboard.history.no')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(batch.id);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all duration-200"
                    title={t('dashboard.history.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Row 2: Stats */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-text-muted" />
                  <span className="text-text-muted">{t('dashboard.history.records')}:</span>
                  <span className="font-medium text-secondary">{batch.recordCount}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-text-muted">
                  <span>CAC: <strong className="text-text-main">{formatNumber(batch.strategicKpis?.cac)}</strong></span>
                  <span>LTV: <strong className="text-text-main">{formatNumber(batch.strategicKpis?.ltv)}</strong></span>
                  <span>TAM: <strong className="text-text-main">{formatNumber(batch.strategicKpis?.tam)}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
