import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Landmark, BookOpen, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip } from '../ui';
import type { ValuationResult } from '../../types/valuation';

interface Props {
  result: ValuationResult;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(value);
};

export const ValuationResultCard = ({ result }: Props) => {
  const { t } = useTranslation();
  const [isFormulaExpanded, setIsFormulaExpanded] = useState(false);

  const renderDeconstruction = () => {
    const { method, inputs, enterpriseValue, equityValue } = result;
    const colorVal = "font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-border/30 shadow-sm";
    
    switch (method) {
      case 'EV_EBITDA':
        return (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2">
              <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Étape 1 : Valeur d'Entreprise (Enterprise Value)</p>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
                <span>EV =</span>
                <span className={`${colorVal} text-[#00D1FF]`} title="EBITDA">EBITDA ({formatCurrency(inputs.ebitda)})</span>
                <span>×</span>
                <span className={`${colorVal} text-purple-400`} title="Multiple">Multiple ({inputs.multiple}x)</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                Calcul : <span className="font-mono text-text-secondary">{formatCurrency(inputs.ebitda)} × {inputs.multiple} = {formatCurrency(enterpriseValue ?? 0)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2">
              <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Étape 2 : Valeur des Capitaux Propres (Equity Value)</p>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
                <span>Equity =</span>
                <span className={`${colorVal} text-indigo-400`} title="Valeur d'Entreprise">EV ({formatCurrency(enterpriseValue ?? 0)})</span>
                <span>−</span>
                <span className={`${colorVal} text-amber-400`} title="Dette Nette">Dette Nette ({formatCurrency(inputs.netDebt)})</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                Calcul : <span className="font-mono text-text-secondary">{formatCurrency(enterpriseValue ?? 0)} − {formatCurrency(inputs.netDebt)} = <span className="text-emerald-400 font-bold">{formatCurrency(equityValue)}</span></span>
              </div>
            </div>
          </div>
        );
      case 'EV_REVENUE':
        return (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2">
              <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Étape 1 : Valeur d'Entreprise (Enterprise Value)</p>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
                <span>EV =</span>
                <span className={`${colorVal} text-[#00D1FF]`} title="Chiffre d'Affaires">Chiffre d'Affaires ({formatCurrency(inputs.revenue)})</span>
                <span>×</span>
                <span className={`${colorVal} text-purple-400`} title="Multiple">Multiple ({inputs.multiple}x)</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                Calcul : <span className="font-mono text-text-secondary">{formatCurrency(inputs.revenue)} × {inputs.multiple} = {formatCurrency(enterpriseValue ?? 0)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2">
              <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Étape 2 : Valeur des Capitaux Propres (Equity Value)</p>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
                <span>Equity =</span>
                <span className={`${colorVal} text-indigo-400`} title="Valeur d'Entreprise">EV ({formatCurrency(enterpriseValue ?? 0)})</span>
                <span>−</span>
                <span className={`${colorVal} text-amber-400`} title="Dette Nette">Dette Nette ({formatCurrency(inputs.netDebt)})</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                Calcul : <span className="font-mono text-text-secondary">{formatCurrency(enterpriseValue ?? 0)} − {formatCurrency(inputs.netDebt)} = <span className="text-emerald-400 font-bold">{formatCurrency(equityValue)}</span></span>
              </div>
            </div>
          </div>
        );
      case 'PE_RATIO':
        return (
          <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Calcul Direct de la Valeur des Capitaux Propres (Equity Value)</p>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
              <span>Equity =</span>
              <span className={`${colorVal} text-[#00D1FF]`} title="Résultat Net">Résultat Net ({formatCurrency(inputs.netIncome)})</span>
              <span>×</span>
              <span className={`${colorVal} text-purple-400`} title="Ratio P/E">Ratio P/E ({inputs.peRatio}x)</span>
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              Calcul : <span className="font-mono text-text-secondary">{formatCurrency(inputs.netIncome)} × {inputs.peRatio} = <span className="text-emerald-400 font-bold">{formatCurrency(equityValue)}</span></span>
            </div>
          </div>
        );
      case 'ASSET_BASED':
        return (
          <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Calcul Basé sur l'Actif Net (Net Asset Value)</p>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary">
              <span>Equity =</span>
              <span className={`${colorVal} text-[#00D1FF]`} title="Actifs Totaux">Actifs Totaux ({formatCurrency(inputs.totalAssets)})</span>
              <span>−</span>
              <span className={`${colorVal} text-amber-400`} title="Passifs Totaux">Passifs ({formatCurrency(inputs.totalLiabilities)})</span>
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              Calcul : <span className="font-mono text-text-secondary">{formatCurrency(inputs.totalAssets)} − {formatCurrency(inputs.totalLiabilities)} = <span className="text-emerald-400 font-bold">{formatCurrency(equityValue)}</span></span>
            </div>
          </div>
        );
      case 'GORDON_GROWTH':
        const denom = inputs.wacc - inputs.growthRate;
        const growthFactor = 1 + inputs.growthRate;
        return (
          <div className="p-3 bg-surface/50 border border-border/30 rounded-xl space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Calcul Basé sur le Modèle de Croissance Gordon (Gordon Growth Model)</p>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-text-primary leading-loose">
              <span>Equity =</span>
              <span className={`${colorVal} text-[#00D1FF]`} title="Flux de Trésorerie Disponible (FCF)">FCF ({formatCurrency(inputs.freeCashFlow)})</span>
              <span>× ( 1 +</span>
              <span className={`${colorVal} text-purple-400`} title="Taux de croissance permanent (g)">g ({(inputs.growthRate * 100).toFixed(2)}%)</span>
              <span>) / (</span>
              <span className={`${colorVal} text-purple-400`} title="WACC (Coût moyen pondéré du capital)">WACC ({(inputs.wacc * 100).toFixed(2)}%)</span>
              <span>−</span>
              <span className={`${colorVal} text-purple-400`} title="Taux de croissance permanent (g)">g ({(inputs.growthRate * 100).toFixed(2)}%)</span>
              <span>)</span>
            </div>
            <div className="text-[11px] text-text-muted mt-2 space-y-1">
              <div>Numérateur (FCF de l'année N+1) : <span className="font-mono text-text-secondary">{formatCurrency(inputs.freeCashFlow)} × {growthFactor.toFixed(3)} = {formatCurrency(inputs.freeCashFlow * growthFactor)}</span></div>
              <div>Dénominateur (WACC − g) : <span className="font-mono text-text-secondary">{(inputs.wacc * 100).toFixed(2)}% − {(inputs.growthRate * 100).toFixed(2)}% = {(denom * 100).toFixed(2)}%</span></div>
              <div className="pt-1 border-t border-border/20 mt-1">
                Calcul final : <span className="font-mono text-text-secondary">{formatCurrency(inputs.freeCashFlow * growthFactor)} / {denom.toFixed(4)} = <span className="text-emerald-400 font-bold">{formatCurrency(equityValue)}</span></span>
              </div>
            </div>
          </div>
        );
      default:
        return <p className="font-mono text-sm text-text-primary">{result.formula}</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Value cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Enterprise Value */}
        {result.enterpriseValue !== null && (
          <div className="glow-card !p-6 border border-border bg-surface/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('valuation.enterpriseValue')}
              </span>
              <Tooltip content={t('valuation.evDescription')}>
                <HelpCircle className="w-3 h-3 text-text-muted/50 cursor-help" />
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight font-mono">
              {formatCurrency(result.enterpriseValue)}
            </p>
            <p className="mt-1.5 text-xs text-text-muted font-medium">
              {t('valuation.evDescription')}
            </p>
          </div>
        )}

        {/* Equity Value */}
        <div className="glow-card !p-6 border border-border bg-surface/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand" />
            </div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {t('valuation.equityValue')}
            </span>
          </div>
          <p className="text-2xl font-bold text-text-primary tracking-tight font-mono">
            {formatCurrency(result.equityValue)}
          </p>
          <p className="mt-1.5 text-xs text-text-muted font-medium">
            {t('valuation.equityDescription')}
          </p>
        </div>
      </div>

      {/* Collapsible Formula Deconstruction Drawer */}
      <div className="card !p-5 overflow-hidden transition-all duration-300 border border-border bg-surface/10">
        <button
          type="button"
          onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
          className="flex items-center justify-between w-full text-xs font-bold text-text-secondary hover:text-brand uppercase tracking-wider transition-colors"
        >
          <span>{t('valuation.formulaApplied', 'Formule Appliquée & Déconstruction')}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-brand capitalize font-bold">
              {isFormulaExpanded ? t('valuation.collapse', 'masquer') : t('valuation.expand', 'déplier les calculs')}
            </span>
            {isFormulaExpanded ? (
              <ChevronUp className="w-4 h-4 text-brand" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </div>
        </button>
        
        {/* Animated panel */}
        <div className={`transition-all duration-500 overflow-hidden ${
          isFormulaExpanded ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {renderDeconstruction()}
        </div>
      </div>

      {/* Explanation */}
      <div className="card !p-5 border border-border bg-surface/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('valuation.explanation')}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              {result.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
