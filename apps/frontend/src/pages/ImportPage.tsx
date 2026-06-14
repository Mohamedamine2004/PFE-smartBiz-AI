import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Database, 
  FileText, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { financialApi } from '../lib/financial.service';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { DownloadTemplateButton } from '../components/ui/DownloadTemplateButton';

// Mock data structured to match the REAL database/backend schemas
const EXCEL_PREVIEWS = {
  annual: {
    title: 'Valuation_Annual',
    desc: 'Données macro-financières annuelles requises pour l\'estimation du modèle de valorisation IA (N, N-1, N-2).',
    headers: [
      'Assets_N',
      'Assets_N_1',
      'Liabilities_N',
      'Liabilities_N_1',
      'Revenues_N',
      'Revenues_N_1',
      'Revenues_N_2',
      'NetIncome_N',
      'OperatingIncome_N',
      'OperatingCashFlow_N',
      'CashAndEquivalents_N'
    ],
    rows: [
      [
        '1 250 000',
        '980 000',
        '450 000',
        '390 000',
        '1 850 000',
        '1 450 000',
        '1 150 000',
        '280 000',
        '340 000',
        '310 000',
        '220 000'
      ]
    ]
  },
  monthly: {
    title: 'CashFlow_Monthly_TTM',
    desc: 'Suivi mensuel de la trésorerie et des métriques de cashflow sur les 12 derniers mois (TTM).',
    headers: ['Metric', '2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30', '2025-05-31'],
    rows: [
      ['Gross_Revenue', '45 000', '48 000', '52 000', '58 000', '61 000'],
      ['Operating_Expenses_Total', '12 000', '12 500', '13 000', '14 200', '15 000'],
      ['Payroll_Expenses', '7 500', '7 500', '8 000', '8 000', '8 500'],
      ['Marketing_Spend', '2 000', '2 200', '2 100', '2 500', '2 800'],
      ['Net_Cash_Burn', '-1 500', '-1 200', '500', '1 100', '2 200'],
      ['Ending_Cash_Balance', '120 000', '118 800', '119 300', '120 400', '122 600'],
      ['New_Customers_Acquired', '15', '18', '20', '25', '22'],
      ['Customers_Churned', '1', '2', '1', '0', '2']
    ]
  },
  kpis: {
    title: 'Strategic_KPIs',
    desc: 'Indicateurs de performance clés stratégiques pour l\'analyse prédictive IA.',
    headers: ['CAC', 'LTV', 'TAM', 'Market_Share', 'Employee_Count'],
    rows: [
      ['120', '960', '15 000 000', '0.05', '14']
    ]
  }
};

type PreviewKey = 'annual' | 'monthly' | 'kpis';

export const ImportPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setHasFinancialData = useAuthStore((state) => state.setHasFinancialData);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Design Interactive states
  const [activeTab, setActiveTab] = useState<PreviewKey>('annual');
  const [isDragActive, setIsDragActive] = useState(false);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setError(t('import.errors.invalidFileType', 'Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)'));
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t('import.errors.fileTooLarge', 'Le fichier dépasse la limite autorisée de 10 Mo.'));
      setFile(null);
      return;
    }

    setFile(selectedFile);
    toast.success(`${selectedFile.name} chargé avec succès !`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
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

      toast.success(t('import.success', 'Données importées avec succès ! Analyse IA en cours...'));
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : t('import.errors.uploadFailed', 'Une erreur s\'est produite. Veuillez vérifier la structure du fichier.');
      const msg = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const currentPreview = EXCEL_PREVIEWS[activeTab];

  const getSheetDesc = () => {
    switch (activeTab) {
      case 'annual':
        return t('import.sheetAnnualDesc', "Données macro-financières annuelles requises pour l'estimation du modèle de valorisation IA (N, N-1, N-2).");
      case 'monthly':
        return t('import.sheetMonthlyDesc', "Suivi mensuel de la trésorerie et des métriques de cashflow sur les 12 derniers mois (TTM).");
      case 'kpis':
        return t('import.sheetKpisDesc', "Indicateurs de performance clés stratégiques pour l'analyse prédictive IA.");
      default:
        return '';
    }
  };

  return (
    <div className="page-animate space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Dynamic Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <PageHeader
          title={t('import.title', 'Importer des Données Financières')}
          subtitle={t('import.subtitle', 'Téléversez l\'historique financier de votre entreprise pour déclencher les modèles d\'IA de valorisation.')}
        />
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN BENTO GRID LAYOUT                                   */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: Upload Panel & Excel Simulator (Takes 2 Cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Interactive Drag & Drop Zone */}
          <div className="dashboard-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-heading flex items-center gap-2.5 font-bold">
                <Database className="w-5 h-5 text-brand" />
                <span>{t('import.zoneTitle', "Zone d'Analyse Financière")}</span>
              </h3>
              {file && (
                <button 
                  onClick={() => setFile(null)}
                  className="text-xs text-text-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t('import.restart', 'Recommencer')}
                </button>
              )}
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 overflow-hidden cursor-pointer
                ${isDragActive 
                  ? 'border-brand bg-brand/5 shadow-[0_0_25px_rgba(0,209,255,0.15)] scale-[1.01]' 
                  : 'border-border/60 hover:border-brand/40 bg-surface/30'
                } ${file ? 'border-success/40 bg-success/5' : ''}`}
            >
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
                className="cursor-pointer flex flex-col items-center w-full"
              >
                {/* Visual Icon Orbit Container */}
                <div className="relative mb-6">
                  {isDragActive && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-[-12px] rounded-full border-2 border-dashed border-brand/50"
                    />
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-300
                    ${file 
                      ? 'bg-success/10 border-success/30 text-success' 
                      : 'bg-background border-border/80 text-text-muted group-hover:scale-105'
                    }`}
                  >
                    {file ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-7 h-7 text-text-main" />}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div
                      key="file-info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <span className="text-text-main font-bold text-lg block">{file.name}</span>
                      <span className="text-xs text-text-muted bg-elevated/80 px-3 py-1 rounded-full border border-border/30 inline-block font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {t('import.readyForAnalysis', "Prêt à l'analyse")}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload-prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-1.5"
                    >
                      <span className="text-text-main font-bold text-base block">
                        {t('import.dragDropPrompt', 'Glissez-déposez votre fichier Excel ici')}
                      </span>
                      <span className="text-sm text-text-muted block">
                        {t('import.orPrompt', 'ou')}{' '}
                        <span className="text-brand font-semibold hover:underline">
                          {t('import.browseLink', 'parcourez vos fichiers')}
                        </span>{' '}
                        {t('import.locallyPrompt', 'localement')}
                      </span>
                      <span className="text-[11px] text-text-muted/60 block pt-2 font-mono">
                        {t('import.fileSpecs', 'Formats acceptés : .xlsx, .xls (Max: 10 Mo)')}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>

            {/* Verification Errors Box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl border border-error/30 bg-error/5 flex items-start gap-3.5"
              >
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-error text-sm">Erreur de structure Excel</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Launch CTA */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                loading={isUploading}
                className="w-full sm:w-auto min-w-[240px] py-4 rounded-xl text-sm font-bold shadow-[0_4px_20px_rgba(0,209,255,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: file ? 'linear-gradient(135deg, var(--brand) 0%, #6366F1 100%)' : 'rgba(255,255,255,0.05)',
                  color: file ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                {isUploading ? (
                  t('import.uploading', 'Modèles d\'IA en action...')
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{t('import.submitBtn', "Lancer l'Import")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Card 2: Interactive CSS Excel Mockup Simulator */}
          <div className="dashboard-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-border/40 pb-5">
              <div>
                <h3 className="section-heading flex items-center gap-2.5 font-bold">
                  <FileSpreadsheet className="w-5 h-5 text-brand" />
                  <span>{t('import.structureTitle', 'Aperçu de la structure requise')}</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  {t('import.structureSubtitle', 'Cliquez sur les feuilles pour visualiser les colonnes et exemples requis.')}
                </p>
              </div>

              {/* Glowing Tabs */}
              <div className="flex items-center gap-1 bg-elevated/40 p-1 rounded-xl border border-border/40 self-start sm:self-auto">
                {(['annual', 'monthly', 'kpis'] as PreviewKey[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-indigo-50 dark:bg-brand/15 text-indigo-600 dark:text-brand shadow-sm dark:shadow-[0_0_10px_rgba(0,209,255,0.1)] border border-indigo-200/60 dark:border-brand/20'
                        : 'text-text-muted hover:text-text-main border border-transparent'
                    }`}
                  >
                    {t(`import.sheetTitle.${tab}`, EXCEL_PREVIEWS[tab].title)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description of active Sheet */}
            <div className="bg-surface/30 p-3.5 rounded-xl border border-border/30 flex items-start gap-2.5 mb-5">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                <strong className="text-text-main">
                  {t('import.sheetLabel', 'Feuille')} [{currentPreview.title}] :
                </strong>{' '}
                {getSheetDesc()}
              </p>
            </div>

            {/* Elegant Excel Simulation Render */}
            <div className="border border-border/50 rounded-2xl overflow-hidden shadow-inner bg-slate-50/80 dark:bg-[#0a0f1d]/50 backdrop-blur-md">
              
              {/* Table header bar */}
              <div className="bg-slate-200/40 dark:bg-elevated/30 border-b border-border/50 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Template_SmartBiz_AI.xlsx</span>
                </div>
                <span className="text-indigo-600 dark:text-brand/80 font-bold uppercase tracking-wider">{activeTab}</span>
              </div>

              {/* The Real Excel Mockup Sheet */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-200/30 dark:bg-elevated/20 border-b border-border/40 text-slate-600 dark:text-text-muted/80 uppercase text-[9px] tracking-wider select-none">
                      <th className="w-8 py-2.5 text-center bg-slate-200/20 dark:bg-elevated/10 border-r border-border/40">#</th>
                      {currentPreview.headers.map((h, i) => (
                        <th key={i} className="px-4 py-2.5 font-bold border-r border-border/40 last:border-none">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPreview.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/30 last:border-none hover:bg-elevated/10 transition-colors">
                        <td className="py-2.5 text-center font-bold text-text-muted/50 bg-slate-200/10 dark:bg-elevated/5 border-r border-border/40 select-none">
                          {rowIndex + 1}
                        </td>
                        {row.map((val, cellIndex) => (
                          <td 
                            key={cellIndex} 
                            className={`px-4 py-2.5 border-r border-border/30 last:border-none font-medium
                              ${(activeTab === 'monthly' && cellIndex === 0) ? 'text-text-main font-semibold bg-elevated/5' : 'text-text-muted'}
                              ${((activeTab === 'monthly' && cellIndex !== 0) || activeTab !== 'monthly') ? 'text-indigo-600 dark:text-brand/90 font-bold' : ''}`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: Download Template & Tech Guide (Takes 1 Col) */}
        {/* ========================================== */}
        <div className="space-y-8">
          
          {/* Card 3: Modern Download Template Panel */}
          <div className="dashboard-card p-6 relative overflow-hidden">
            {/* Soft decorative background radial glow */}
            <div className="absolute top-[-50%] right-[-50%] w-56 h-56 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 shadow-sm">
                <FileSpreadsheet className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h4 className="font-bold text-text-main text-base">{t('import.templateTitle', 'Template Modèle IA')}</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {t('import.templateDesc', 'Commencez en téléchargeant notre fichier Excel officiel. Sa structure stricte permet à l\'algorithme d\'IA de calculer vos scores instantanément.')}
                </p>
                <div className="mt-5">
                  <DownloadTemplateButton variant="outline" className="w-full py-2.5 rounded-xl border-brand/30 hover:border-brand text-xs font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Interactive Business Rules Guide */}
          <div className="dashboard-card p-6">
            <h3 className="section-heading flex items-center gap-2.5 font-bold mb-4">
              <HelpCircle className="w-5 h-5 text-brand" />
              <span>{t('import.instructionsTitle', 'Consignes Tactiques')}</span>
            </h3>
            
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-surface/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_6px_var(--brand)]" />
                  <strong className="text-xs text-text-main">{t('import.integrityTitle', 'Intégrité des En-têtes')}</strong>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {t('import.integrityDesc', 'Ne renommez **JAMAIS** les onglets Excel ou les en-têtes de colonnes. Les algorithmes d\'IA recherchent ces mots-clés spécifiques.')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_6px_var(--brand)]" />
                  <strong className="text-xs text-text-main">{t('import.formatTitle', 'Formatage Temporel')}</strong>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {t('import.formatDesc', 'Renseignez les dates au format standardisé international `AAAA-MM-JJ` (ex: `2025-01-31`).')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                  <strong className="text-xs text-text-main">{t('import.currencyTitle', 'Dinar Tunisien (DT)')}</strong>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {t('import.currencyDesc', 'Saisissez les montants sous forme brute (sans lettres ni symboles `DT`). La devise est configurée automatiquement en Dinar Tunisien (DT) à l\'analyse.')}
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};