import { useEffect, useMemo, useState } from 'react';
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

interface RevenueProjectionChartProps {
  scenarios: ScenarioPrediction[];
  valuation: FinancialValuation;
  historicalMetrics: DashboardMetrics | null;
}

export const RevenueProjectionChart = ({ scenarios, valuation, historicalMetrics }: RevenueProjectionChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [activeScenarioId, setActiveScenarioId] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');

  const activeScenario = useMemo(
    () => getScenarioByLabel(scenarios, activeScenarioId) || getScenarioByLabel(scenarios, 'realistic') || scenarios[0],
    [scenarios, activeScenarioId],
  );

  const baselineMultiple = useMemo(() => {
    const y3Revenue = valuation.Projected_Revenue_Y3;
    if (!y3Revenue) return 3;
    return valuation.Enterprise_Value_Y3 / y3Revenue;
  }, [valuation]);

  const baselineDebtY1 = useMemo(() => Math.max(0, valuation.Enterprise_Value_Y1 - valuation.Equity_Value_Y1), [valuation]);
  const baselineDebtY2 = useMemo(() => Math.max(0, valuation.Enterprise_Value_Y2 - valuation.Equity_Value_Y2), [valuation]);

  const [exitMultiple, setExitMultiple] = useState(baselineMultiple);
  const [debtY1, setDebtY1] = useState(baselineDebtY1);
  const [debtY2, setDebtY2] = useState(baselineDebtY2);

  useEffect(() => {
    setExitMultiple(Number.isFinite(baselineMultiple) ? baselineMultiple : 3);
    setDebtY1(baselineDebtY1);
    setDebtY2(baselineDebtY2);
  }, [baselineMultiple, baselineDebtY1, baselineDebtY2]);

  const adjustedValuation = useMemo(
    () => computeAdjustedValuation(activeScenario ?? null, exitMultiple, debtY1, debtY2),
    [activeScenario, exitMultiple, debtY1, debtY2],
  );

  const chartData = useMemo(() => {
    return buildChartData(
      scenarios,
      valuation,
      historicalMetrics,
      adjustedValuation,
      exitMultiple,
      debtY1,
      debtY2,
    );
  }, [scenarios, valuation, historicalMetrics, adjustedValuation, exitMultiple, debtY1, debtY2]);

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
      />

      {/* ── RESPONSIVE CHART ── */}
      <ResponsiveContainer width="100%" height={viewMode === 'revenue' ? 420 : 340} className="mt-8">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="projOptimistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="projPessimistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F43F5E" stopOpacity={0.08} /><stop offset="100%" stopColor="#F43F5E" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="projRealistic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} /><stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} /></linearGradient>
            
            <linearGradient id="stackEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} /></linearGradient>
            <linearGradient id="stackDebt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} /></linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
          <YAxis domain={yDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => {
              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
              return v;
          }} />
          <Tooltip content={<RevenueProjectionTooltip viewMode={viewMode} />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 2, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} iconType="circle" iconSize={8} />
          <ReferenceLine y={referenceY} stroke="var(--text-muted)" strokeDasharray="4 4" strokeOpacity={0.3} />

          {/* ────── RENDER REVENUE METRICS ────── */}
          {viewMode === 'revenue' && (
            <>
              <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#10B981" strokeWidth={2} strokeDasharray="6 3" fill="url(#projOptimistic)" animationDuration={1200} />
              <Area type="monotone" dataKey="realistic" name="Realistic" stroke="#6366F1" strokeWidth={3} fill="url(#projRealistic)" animationDuration={1000} dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              <Area type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#F43F5E" strokeWidth={2} strokeDasharray="6 3" fill="url(#projPessimistic)" animationDuration={1400} />
            </>
          )}

          {/* ────── RENDER VALUATION (STACKED) ────── */}
          {viewMode === 'valuation' && (
             <>
               <Area type="monotone" dataKey="equity" name="Equity" stackId="1" stroke="#F59E0B" strokeWidth={3} fill="url(#stackEquity)" animationDuration={1000} activeDot={{ r: 6 }} />
               <Area type="monotone" dataKey="debt" name="Debt" stackId="1" stroke="#EF4444" strokeWidth={3} fill="url(#stackDebt)" animationDuration={1200} activeDot={{ r: 6 }} />
             </>
          )}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
