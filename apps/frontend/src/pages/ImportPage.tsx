import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { financialApi } from '../lib/financial.service';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { DownloadTemplateButton } from '../components/ui/DownloadTemplateButton';

export const ImportPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const setHasFinancialData = useAuthStore((state) => state.setHasFinancialData); 

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError(t('import.errors.invalidFileType', 'Please select a valid Excel file (.xlsx or .xls)'));
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError(t('import.errors.fileTooLarge', 'File exceeds the 10MB limit.'));
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      await financialApi.importData(file);

      if (setHasFinancialData) {
        setHasFinancialData(true);
      }

      toast.success(t('import.success', 'Data imported successfully! Redirecting to dashboard...'));
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errorMessage = err.response?.data?.message || t('import.errors.uploadFailed', 'An error occurred during import. Please check your data format.');
      const msg = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-animate space-y-8 max-w-3xl mx-auto pb-12">
      <PageHeader 
        title={t('import.title', 'Import Financial Data')} 
        subtitle={t('import.subtitle', 'Upload your historical data to generate AI valuations and strategic insights.')} 
      />

      {/* Step 1: Template Download */}
      <div className="card p-6 border border-border rounded-lg bg-background">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="section-heading flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand" />
              {t('import.step1.title', 'Step 1: Download Template')}
            </h3>
            <p className="text-helper mt-2 max-w-md">
              {t('import.step1.description', 'Start by downloading our strictly formatted Excel template. This structure is required for the AI engine to process your data.')}
            </p>
          </div>
          <div className="shrink-0">
            <DownloadTemplateButton variant="outline" />
          </div>
        </div>
      </div>

      {/* Step 2: Instructions (NEW) */}
      <div className="card p-6 border border-border rounded-lg bg-background">
        <h3 className="section-heading flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-brand" />
          {t('import.step2.title', 'Step 2: How to fill the template')}
        </h3>
        
        <div className="space-y-4 text-sm text-text-muted">
          <p>{t('import.step2.intro', 'The template contains three specific sheets. Do not rename the sheets or modify the column headers.')}</p>
          
          <ul className="space-y-3 mt-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-main">Valuation_Annual:</strong> 
                {t('import.step2.sheet1', ' Fill in the single row with your macro-financial features (Assets, Liabilities, Net Income). This feeds directly into the machine learning valuation model.')}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-main">CashFlow_Monthly_TTM:</strong> 
                {t('import.step2.sheet2', ' Enter your trailing 12-month metrics. The columns represent dates (YYYY-MM-DD). Fill out the values corresponding to each metric row (e.g., Gross_Revenue).')}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-main">Strategic_KPIs:</strong> 
                {t('import.step2.sheet3', ' Provide your exact numbers for CAC, LTV, TAM, Market Share, and Employee Count. These are used to generate contextual business strategies.')}
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Step 3: File Upload */}
      <div className="card p-6 border border-border rounded-lg bg-background">
        <h3 className="section-heading mb-4">
          {t('import.step3.title', 'Step 3: Upload Completed File')}
        </h3>
        
        <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
          file ? 'border-brand/50 bg-brand/5' : 'border-border hover:border-brand/30'
        }`}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            className="hidden" 
            id="excel-upload"
            disabled={isUploading}
          />
          <label 
            htmlFor="excel-upload" 
            className={`cursor-pointer flex flex-col items-center w-full ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Upload className="w-5 h-5 text-text-main" />
            </div>
            <span className="text-text-main font-medium mb-1">
              {file ? file.name : t('import.step3.selectFile', 'Click to select Excel file')}
            </span>
            <span className="text-xs text-text-muted mt-1">
              {t('import.step3.fileSpecs', 'Accepted formats: .xlsx, .xls (Max: 10MB)')}
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3 text-error text-sm animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{t('import.errors.validationTitle', 'Validation Error')}</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleUpload} 
            disabled={!file}
            loading={isUploading}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isUploading 
              ? t('import.uploading', 'Processing Data...') 
              : t('import.submitBtn', 'Run Import & Analysis')}
          </Button>
        </div>
      </div>
    </div>
  );
};