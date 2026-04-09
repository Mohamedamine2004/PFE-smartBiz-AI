import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Check } from 'lucide-react';
import { Button } from '../ui';
import { exportPDF } from './exportUtils';
import type { ValuationResult } from '../../types/valuation';

interface Props {
  result: ValuationResult;
}

export const ExportButtons = ({ result }: Props) => {
  const { t } = useTranslation();
  const [exported, setExported] = useState(false);

  const handlePDF = () => {
    exportPDF(result, {
      title: t('valuation.title'),
      ev: t('valuation.enterpriseValue'),
      equity: t('valuation.equityValue'),
      formula: t('valuation.formulaApplied'),
      explanation: t('valuation.explanation'),
      inputs: t('valuation.export.inputs'),
      generatedOn: t('valuation.export.generatedOn'),
    });
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <Button
      variant="outline"
      icon={
        exported ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )
      }
      className={`!text-xs transition-colors ${exported ? '!border-success/50 !text-success' : ''}`}
      onClick={handlePDF}
    >
      {exported ? t('valuation.export.exported') : 'PDF'}
    </Button>
  );
};


