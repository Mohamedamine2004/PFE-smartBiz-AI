import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ScenarioPrediction, FinancialValuation, DashboardMetrics } from '../../types/dashboard';
import { RevenueProjectionControls } from './RevenueProjectionControls';
import { RevenueProjectionTooltip } from './RevenueProjectionTooltip';
import {
  buildChartData,
  computeAdjustedValuation,
  computeYDomain,
  getScenarioByLabel,
  type ViewMode,
} from './revenueProjectionChart.utils';
import { getCurrencySymbol } from '../../lib/format.utils';
import api from '../../lib/axios';

interface RevenueProjectionChartProps {
  scenarios: ScenarioPrediction[];
  valuation: FinancialValuation;
  historicalMetrics: DashboardMetrics | null;
}

export const RevenueProjectionChart = ({ scenarios, valuation, historicalMetrics }: RevenueProjectionChartProps) => {
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [activeScenarioId, setActiveScenarioId] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');

  const [currencySymbol, setCurrencySymbol] = useState('€');

  useEffect(() => {
    api.get('/company/profile')
      .then((res) => {
        if (res.data?.currency) {
          setCurrencySymbol(getCurrencySymbol(res.data.currency, i18n.resolvedLanguage));
        }
      })
      .catch(() => {});
  }, [i18n.resolvedLanguage]);

  // New Simulation Modifiers (Dynamic & Connected to Real Data)
  const [growthModifier, setGrowthModifier] = useState(0); // Offset in percentage (e.g. +5% or -10%)
  const [volatility, setVolatility] = useState(12); // Spread parameter for Monte Carlo bands (1% - 30%)

  const baselineMultiple = useMemo(() => {
    const y3Revenue = valuation.Projected_Revenue_Y3;
    if (!y3Revenue) return 3.5;
    return valuation.Enterprise_Value_Y3 / y3Revenue;
  }, [valuation]);

  const baselineDebtY1 = useMemo(() => Math.max(0, valuation.Enterprise_Value_Y1 - valuation.Equity_Value_Y1), [valuation]);
  const baselineDebtY2 = useMemo(() => Math.max(0, valuation.Enterprise_Value_Y2 - valuation.Equity_Value_Y2), [valuation]);

  const [exitMultiple, setExitMultiple] = useState(baselineMultiple);
  const [debtY1, setDebtY1] = useState(baselineDebtY1);
  const [debtY2, setDebtY2] = useState(baselineDebtY2);

  useEffect(() => {
    setExitMultiple(Number.isFinite(baselineMultiple) ? baselineMultiple : 3.5);
    setDebtY1(baselineDebtY1);
    setDebtY2(baselineDebtY2);
  }, [baselineMultiple, baselineDebtY1, baselineDebtY2]);

  // Apply growthModifier to the scenarios
  const adjustedScenarios = useMemo(() => {
    const currentRevenue = valuation.Current_Revenue || 100000;
    
    return scenarios.map((scenario) => {
      // Add the growth offset directly to the scenario CAGR
      const y1_cagr = scenario.Y1_CAGR + (growthModifier / 100);
      const y2_cagr = scenario.Y2_CAGR + (growthModifier / 100);
      const y3_cagr = scenario.Y3_CAGR + (growthModifier / 100);

      const projectedY1 = currentRevenue * (1 + y1_cagr);
      const projectedY2 = projectedY1 * (1 + y2_cagr);
      const projectedY3 = projectedY2 * (1 + y3_cagr);

      return {
        ...scenario,
        Y1_CAGR: y1_cagr,
        Y2_CAGR: y2_cagr,
        Y3_CAGR: y3_cagr,
        Projected_Revenue_Y1: projectedY1,
        Projected_Revenue_Y2: projectedY2,
        Projected_Revenue_Y3: projectedY3,
      };
    });
  }, [scenarios, growthModifier, valuation.Current_Revenue]);

  // Apply volatility parameter to spread the Monte Carlo probability cone
  const finalScenarios = useMemo(() => {
    const realistic = adjustedScenarios.find((s) => s.label === 'realistic') || adjustedScenarios[0];
    if (!realistic) return adjustedScenarios;

    return adjustedScenarios.map((scenario) => {
      if (scenario.label === 'realistic') return scenario;

      const direction = scenario.label === 'optimistic' ? 1 : -1;
      const volFactor = volatility / 100;

      // Volatility expands optimistic upwards and pessimistic downwards
      const projectedY1 = realistic.Projected_Revenue_Y1 * (1 + direction * volFactor);
      const projectedY2 = realistic.Projected_Revenue_Y2 * (1 + direction * volFactor * 1.4);
      const projectedY3 = realistic.Projected_Revenue_Y3 * (1 + direction * volFactor * 1.8);

      return {
        ...scenario,
        Projected_Revenue_Y1: projectedY1,
        Projected_Revenue_Y2: projectedY2,
        Projected_Revenue_Y3: projectedY3,
        Y1_CAGR: (projectedY1 - valuation.Current_Revenue) / valuation.Current_Revenue,
      };
    });
  }, [adjustedScenarios, volatility, valuation.Current_Revenue]);

  const activeScenario = useMemo(
    () => getScenarioByLabel(finalScenarios, activeScenarioId) || getScenarioByLabel(finalScenarios, 'realistic') || finalScenarios[0],
    [finalScenarios, activeScenarioId],
  );

  const adjustedValuation = useMemo(
    () => computeAdjustedValuation(activeScenario ?? null, exitMultiple, debtY1, debtY2),
    [activeScenario, exitMultiple, debtY1, debtY2],
  );

  const chartData = useMemo(() => {
    return buildChartData(
      finalScenarios,
      valuation,
      historicalMetrics,
      adjustedValuation,
      exitMultiple,
      debtY1,
      debtY2,
    );
  }, [finalScenarios, valuation, historicalMetrics, adjustedValuation, exitMultiple, debtY1, debtY2]);

  const yDomain = useMemo(() => computeYDomain(chartData, viewMode), [chartData, viewMode]);
  const referenceY = Number(viewMode === 'revenue' ? chartData[0]?.realistic : chartData[0]?.enterprise) || 0;

  if (chartData.length === 0) return null;

  return (
    <div className="chart-container overflow-hidden space-y-6">
      
      <RevenueProjectionControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeScenarioId={activeScenarioId}
        setActiveScenarioId={setActiveScenarioId}
        exitMultiple={exitMultiple}
        setExitMultiple={setExitMultiple}
        debtY1={debtY1}
        setDebtY1={setDebtY1}
        debtY2={debtY2}
        setDebtY2={setDebtY2}
        maxDebtY1={Math.max(valuation.Enterprise_Value_Y1 * 1.5, 1000)}
        maxDebtY2={Math.max(valuation.Enterprise_Value_Y2 * 1.5, 1000)}
        growthModifier={growthModifier}
        setGrowthModifier={setGrowthModifier}
        volatility={volatility}
        setVolatility={setVolatility}
        currencySymbol={currencySymbol}
      />

      {/* ── RESPONSIVE CHART ── */}
      <ResponsiveContainer width="100%" height={viewMode === 'revenue' ? 420 : 340} className="mt-8">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            {/* Shaded confidence bands for Monte Carlo simulation cone */}
            <linearGradient id="projMonteCarlo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D1FF" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
            </linearGradient>

            <linearGradient id="projOptimistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.12} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="projPessimistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F43F5E" stopOpacity={0.05} /><stop offset="100%" stopColor="#F43F5E" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="projRealistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.22} /><stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} /></linearGradient>
            
            <linearGradient id="stackEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} /></linearGradient>
            <linearGradient id="stackDebt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} /></linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
          <YAxis domain={yDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => {
              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ${currencySymbol}`;
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${currencySymbol}`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ${currencySymbol}`;
              return `${v} ${currencySymbol}`;
          }} />
          <Tooltip content={<RevenueProjectionTooltip viewMode={viewMode} currencySymbol={currencySymbol} />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 2, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} iconType="circle" iconSize={8} />
          <ReferenceLine y={referenceY} stroke="var(--text-muted)" strokeDasharray="4 4" strokeOpacity={0.3} />

          {/* ────── RENDER REVENUE METRICS ────── */}
          {viewMode === 'revenue' && (
            <>
              {/* Monte Carlo Shaded Probability Cone */}
              <Area
                type="monotone"
                dataKey="optimistic"
                name={t('dashboard.mlZone.scenarios.confidenceZone', 'Zone de Confiance (Monte Carlo)')}
                stroke="none"
                fill="url(#projMonteCarlo)"
                animationDuration={1000}
                legendType="square"
              />
              <Area type="monotone" dataKey="optimistic" name={t('dashboard.mlZone.scenarios.optimistic')} stroke="#10B981" strokeWidth={2} strokeDasharray="6 3" fill="none" animationDuration={1200} />
              <Area type="monotone" dataKey="realistic" name={t('dashboard.mlZone.scenarios.realistic')} stroke="#6366F1" strokeWidth={3} fill="url(#projRealistic)" animationDuration={1000} dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              <Area type="monotone" dataKey="pessimistic" name={t('dashboard.mlZone.scenarios.pessimistic')} stroke="#F43F5E" strokeWidth={2} strokeDasharray="6 3" fill="none" animationDuration={1400} />
            </>
          )}

          {/* ────── RENDER VALUATION (STACKED) ────── */}
          {viewMode === 'valuation' && (
             <>
               <Area type="monotone" dataKey="equity" name={t('valuation.equityValue')} stackId="1" stroke="#F59E0B" strokeWidth={3} fill="url(#stackEquity)" animationDuration={1000} activeDot={{ r: 6 }} />
               <Area type="monotone" dataKey="debt" name={t('valuation.fields.netDebt')} stackId="1" stroke="#EF4444" strokeWidth={3} fill="url(#stackDebt)" animationDuration={1200} activeDot={{ r: 6 }} />
             </>
          )}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
