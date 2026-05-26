import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Trash2, RotateCcw, X } from 'lucide-react';
import { valuationApi } from '../../lib/valuationApi';
import { useValuationStore } from '../../store/valuationStore';
import { Button } from '../ui';
import type { SavedValuation } from '../../types/valuation';
import type { ValuationMethod } from '../../types/valuation';

const METHOD_LABELS: Record<string, string> = {
  EV_EBITDA: 'valuation.methods.evEbitda',
  EV_REVENUE: 'valuation.methods.evRevenue',
  PE_RATIO: 'valuation.methods.peRatio',
  ASSET_BASED: 'valuation.methods.assetBased',
  GORDON_GROWTH: 'valuation.methods.gordonGrowth',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(v);

export const HistoryPanel = () => {
  const { t } = useTranslation();
  const {
    history,
    setHistory,
    historyOpen,
    setHistoryOpen,
    setSelectedMethod,
    setResult,
  } = useValuationStore();
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await valuationApi.getHistory();
      setHistory(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpen) fetchHistory();
  }, [historyOpen]);

  const handleRestore = (item: SavedValuation) => {
    setSelectedMethod(item.method as ValuationMethod);
    setResult({
      method: item.method as ValuationMethod,
      enterpriseValue: item.enterpriseValue,
      equityValue: item.equityValue,
      formula: item.formula,
      explanation: item.explanation,
      inputs: item.inputs,
    });
    setHistoryOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await valuationApi.deleteValuation(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch {
      // ignore
    }
  };

  if (!historyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setHistoryOpen(false)}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-text-main">
              {t('valuation.history.title')}
            </h2>
          </div>
          <button
            onClick={() => setHistoryOpen(false)}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <p className="text-xs text-text-muted text-center py-8">
              {t('valuation.history.loading')}
            </p>
          )}
          {!loading && history.length === 0 && (
            <p className="text-xs text-text-muted text-center py-8">
              {t('valuation.history.empty')}
            </p>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              className="card !p-4 group cursor-pointer hover:border-brand/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-mono font-medium text-brand">
                    {t(METHOD_LABELS[item.method] ?? item.method)}
                  </span>
                  {item.label && (
                    <span className="ml-2 text-xs text-text-muted">
                      — {item.label}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-text-muted">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-lg font-semibold text-text-main">
                {fmt(item.equityValue)}
              </p>
              {item.enterpriseValue !== null && (
                <p className="text-xs text-text-muted">
                  EV: {fmt(item.enterpriseValue)}
                </p>
              )}
              {/* Actions */}
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  icon={<RotateCcw className="w-3 h-3" />}
                  className="!text-xs !py-1 !px-2"
                  onClick={() => handleRestore(item)}
                >
                  {t('valuation.history.restore')}
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 className="w-3 h-3" />}
                  className="!text-xs !py-1 !px-2"
                  onClick={() => handleDelete(item.id)}
                >
                  {t('valuation.history.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


