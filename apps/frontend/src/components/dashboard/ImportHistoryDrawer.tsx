import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ImportHistory } from '../ImportHistory';

interface ImportHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchDeleted: () => void;
  onBatchSelect: (batchId: string) => void;
  activeBatchId: string | null;
}

export const ImportHistoryDrawer = ({
  isOpen,
  onClose,
  onBatchDeleted,
  onBatchSelect,
  activeBatchId,
}: ImportHistoryDrawerProps) => {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dark overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-surface border-l border-border z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-[58px] border-b border-border">
          <h2 className="text-base font-medium text-text-main">
            {t('dashboard.history.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-elevated transition-colors"
            title={t('dashboard.history.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="overflow-y-auto h-[calc(100%-58px)] p-0">
          <ImportHistory
            onBatchDeleted={onBatchDeleted}
            onBatchSelect={onBatchSelect}
            activeBatchId={activeBatchId}
          />
        </div>
      </div>
    </>
  );
};
