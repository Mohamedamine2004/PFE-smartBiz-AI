import { Download, FileText, Table } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { downloadPDFReport, exportToExcel } from '../../lib/report.generator';

interface ExportButtonsProps {
  metrics: any;
  companyName: string;
  period: string;
}

/**
 * Export buttons for PDF and Excel report generation.
 */
export const ExportButtons = ({ metrics, companyName, period }: ExportButtonsProps) => {
  const { t } = useTranslation();

  const handlePDFExport = async () => {
    try {
      await downloadPDFReport(companyName, metrics, period);
      toast.success(t('dashboard.exportPDF.success', 'PDF report downloaded'));
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(t('dashboard.exportPDF.error', 'Failed to generate PDF report'));
    }
  };

  const handleExcelExport = async () => {
    try {
      await exportToExcel(metrics, companyName);
      toast.success(t('dashboard.exportExcel.success', 'Excel report downloaded'));
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error(t('dashboard.exportExcel.error', 'Failed to generate Excel report'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePDFExport}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main bg-surface border border-border rounded-lg hover:bg-elevated transition-colors min-h-[44px]"
        title={t('dashboard.exportPDF.tooltip', 'Export as PDF')}
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </button>
      
      <button
        onClick={handleExcelExport}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main bg-surface border border-border rounded-lg hover:bg-elevated transition-colors min-h-[44px]"
        title={t('dashboard.exportExcel.tooltip', 'Export as Excel')}
      >
        <Table className="w-4 h-4" />
        <span className="hidden sm:inline">Excel</span>
      </button>
    </div>
  );
};
