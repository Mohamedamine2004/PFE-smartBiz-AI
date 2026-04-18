import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Save, GitCompareArrows, Calculator } from 'lucide-react';
import { useValuationStore } from '../store/valuationStore';
import { valuationApi } from '../lib/valuationApi';
import { PageHeader, Button, EmptyState } from '../components/ui';
import { MethodSelector } from '../components/valuation/MethodSelector';
import { ValuationForm } from '../components/valuation/ValuationForm';
import { ValuationResultCard } from '../components/valuation/ValuationResultCard';
import { SensitivitySliders } from '../components/valuation/SensitivitySliders';
import { ExportButtons } from '../components/valuation/ExportButtons';
import { HistoryPanel } from '../components/valuation/HistoryPanel';
import { ComparisonView } from '../components/valuation/ComparisonView';
import type { ValuationInputs } from '../types/valuation';
import { ValuationMethod } from '../types/valuation';

export const Valuation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    methods,
    selectedMethod,
    result,
    loading,
    error,
    compareResult,
    compareMethod,
    setMethods,
    setSelectedMethod,
    setResult,
    setLoading,
    setError,
    setHistoryOpen,
    setCompareResult,
    setCompareMethod,
  } = useValuationStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await valuationApi.getMethods();
        setMethods(data);

        const methodParam = searchParams.get('method') as typeof selectedMethod;
        if (methodParam && data.some(m => m.id === methodParam)) {
          setSelectedMethod(methodParam);
        } else if (!selectedMethod) {
          const defaultMethod = data.find((m) => m.id === ValuationMethod.EV_EBITDA)?.id ?? data[0]?.id;
          if (defaultMethod) {
            setSelectedMethod(defaultMethod);
            setSearchParams({ method: defaultMethod }, { replace: true });
          }
        }
      } catch {
        setError(t('valuation.loadError'));
      }
    };
    fetchMethods();
  }, [setMethods, setError, t]);

  useEffect(() => {
    const methodParam = searchParams.get('method') as typeof selectedMethod;
    if (methodParam && methodParam !== selectedMethod && methods.some(m => m.id === methodParam)) {
      setSelectedMethod(methodParam);
    }
  }, [searchParams, selectedMethod, setSelectedMethod, methods]);

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    setSearchParams({ method });
  };

  const handleCalculate = async (inputs: ValuationInputs) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const data = await valuationApi.calculate(inputs);
      setResult(data);
      toast.success(t('valuation.calcSuccess', 'Valuation calculated successfully!'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('valuation.calcError', 'Failed to calculate valuation.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareCalculate = async (inputs: ValuationInputs) => {
    setCompareLoading(true);
    try {
      const data = await valuationApi.calculate(inputs);
      setCompareResult(data);
    } catch {
      // ignore
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    try {
      await valuationApi.save({
        method: result.method,
        ...result.inputs,
      } as ValuationInputs);
      setSaved(true);
      toast.success(t('valuation.saveSuccess', 'Valuation saved successfully!'));
    } catch {
      toast.error(t('valuation.saveError', 'Failed to save valuation.'));
    } finally {
      setSaving(false);
    }
  }, [result]);

  const toggleCompare = () => {
    setCompareMode((v) => !v);
    if (compareMode) {
      setCompareResult(null);
      setCompareMethod(null);
    }
  };

  return (
    <div className="page-animate space-y-8">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title={t('valuation.title')}
          subtitle={t('valuation.subtitle')}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            icon={<Clock className="w-3.5 h-3.5" />}
            className="!text-xs"
            onClick={() => setHistoryOpen(true)}
          >
            {t('valuation.history.title')}
          </Button>
          {result && (
            <>
              <Button
                variant="outline"
                icon={<GitCompareArrows className="w-3.5 h-3.5" />}
                className={`!text-xs ${compareMode ? '!border-secondary !text-secondary' : ''}`}
                onClick={toggleCompare}
              >
                {t('valuation.compare.toggle')}
              </Button>
              <Button
                variant="outline"
                icon={<Save className="w-3.5 h-3.5" />}
                className="!text-xs"
                onClick={handleSave}
                loading={saving}
                disabled={saved}
              >
                {saved ? t('valuation.saved') : t('valuation.save')}
              </Button>
              <ExportButtons result={result} />
            </>
          )}
        </div>
      </div>

      {/* Method tabs */}
      <MethodSelector
        methods={methods}
        selected={selectedMethod}
        onSelect={handleMethodSelect}
      />

      {/* Main content — form + results side by side */}
      {selectedMethod && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card !p-6 space-y-5">
              <ValuationForm
                method={selectedMethod}
                onSubmit={handleCalculate}
                loading={loading}
              />
            </div>

            {/* Compare form */}
            {compareMode && (
              <div className="card !p-6 space-y-4 !border-secondary/30">
                <div className="flex items-center gap-2 mb-1">
                  <GitCompareArrows className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                    {t('valuation.compare.secondMethod')}
                  </span>
                </div>
                <MethodSelector
                  methods={methods.filter((m) => m.id !== selectedMethod)}
                  selected={compareMethod}
                  onSelect={setCompareMethod}
                />
                {compareMethod && (
                  <ValuationForm
                    method={compareMethod}
                    onSubmit={handleCompareCalculate}
                    loading={compareLoading}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right: results or empty state */}
          <div className="lg:col-span-3">
            {error && (
              <div className="card !p-4 !border-error/30 mb-6">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {result ? (
              <div className="space-y-6">
                <ValuationResultCard result={result} />
                <SensitivitySliders result={result} />
                {/* Comparison view */}
                {compareMode && compareResult && (
                  <ComparisonView primary={result} compare={compareResult} />
                )}
              </div>
            ) : (
              <EmptyState
                icon={Calculator}
                title={t('valuation.empty.title', 'Ready to calculate')}
                description={t('valuation.empty.description', 'Fill in the valuation parameters on the left to calculate your company\'s worth using AI-powered methods.')}
              />
            )}
          </div>
        </div>
      )}

      {/* History slide-over panel */}
      <HistoryPanel />
    </div>
  );
};
