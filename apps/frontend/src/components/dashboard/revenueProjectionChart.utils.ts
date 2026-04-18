import type { DashboardMetrics, FinancialValuation, ScenarioPrediction } from '../../types/dashboard';

export type ViewMode = 'revenue' | 'valuation';

export interface AdjustedValuation {
  enterpriseY1: number;
  enterpriseY2: number;
  enterpriseY3: number;
  equityY1: number;
  equityY2: number;
  equityY3: number;
}

export const getScenarioByLabel = (
  scenarios: ScenarioPrediction[],
  label: 'realistic' | 'optimistic' | 'pessimistic',
): ScenarioPrediction | null => scenarios.find((s) => s.label === label) || null;

export const computeAdjustedValuation = (
  scenario: ScenarioPrediction | null,
  exitMultiple: number,
  debtY1: number,
  debtY2: number,
): AdjustedValuation | null => {
  if (!scenario) return null;

  const enterpriseY1 = scenario.Projected_Revenue_Y1 * exitMultiple;
  const enterpriseY2 = scenario.Projected_Revenue_Y2 * exitMultiple;
  const enterpriseY3 = scenario.Projected_Revenue_Y3 * exitMultiple;

  return {
    enterpriseY1,
    enterpriseY2,
    enterpriseY3,
    equityY1: Math.max(0, enterpriseY1 - debtY1),
    equityY2: Math.max(0, enterpriseY2 - debtY2),
    equityY3: Math.max(0, enterpriseY3 - debtY2),
  };
};

export const buildChartData = (
  scenarios: ScenarioPrediction[],
  valuation: FinancialValuation,
  historicalMetrics: DashboardMetrics | null,
  adjustedValuation: AdjustedValuation | null,
  exitMultiple: number,
  debtY1: number,
  debtY2: number,
) => {
  const optimistic = getScenarioByLabel(scenarios, 'optimistic');
  const realistic = getScenarioByLabel(scenarios, 'realistic');
  const pessimistic = getScenarioByLabel(scenarios, 'pessimistic');

  if (!optimistic || !realistic || !pessimistic) return [];

  const data: Array<Record<string, number | string | boolean>> = [];
  const macro = historicalMetrics?.macroFeatures;

  const currentDebt = macro?.Liabilities_N != null ? Number(macro.Liabilities_N) : debtY1;
  const yMinus1Debt = macro?.Liabilities_N_1 != null ? Number(macro.Liabilities_N_1) : currentDebt;
  const yMinus2Debt = yMinus1Debt;

  if (macro?.Revenues_N_2) {
    const rev = Number(macro.Revenues_N_2);
    const ent = rev * exitMultiple;
    data.push({
      year: 'Year -2',
      realistic: rev,
      optimistic: rev,
      pessimistic: rev,
      enterprise: ent,
      equity: Math.max(0, ent - yMinus2Debt),
      debt: yMinus2Debt,
      isHistory: true,
    });
  }

  if (macro?.Revenues_N_1) {
    const rev = Number(macro.Revenues_N_1);
    const ent = rev * exitMultiple;
    data.push({
      year: 'Year -1',
      realistic: rev,
      optimistic: rev,
      pessimistic: rev,
      enterprise: ent,
      equity: Math.max(0, ent - yMinus1Debt),
      debt: yMinus1Debt,
      isHistory: true,
    });
  }

  const currentRev = valuation.Current_Revenue;
  const currentEnt = currentRev * exitMultiple;
  data.push({
    year: 'Current',
    realistic: currentRev,
    optimistic: currentRev,
    pessimistic: currentRev,
    enterprise: currentEnt,
    equity: Math.max(0, currentEnt - currentDebt),
    debt: currentDebt,
    isHistory: true,
  });

  data.push({
    year: 'Year 1',
    realistic: realistic.Projected_Revenue_Y1,
    optimistic: optimistic.Projected_Revenue_Y1,
    pessimistic: pessimistic.Projected_Revenue_Y1,
    enterprise: adjustedValuation?.enterpriseY1 ?? 0,
    equity: adjustedValuation?.equityY1 ?? 0,
    debt: debtY1,
    isHistory: false,
  });

  data.push({
    year: 'Year 2',
    realistic: realistic.Projected_Revenue_Y2,
    optimistic: optimistic.Projected_Revenue_Y2,
    pessimistic: pessimistic.Projected_Revenue_Y2,
    enterprise: adjustedValuation?.enterpriseY2 ?? 0,
    equity: adjustedValuation?.equityY2 ?? 0,
    debt: debtY2,
    isHistory: false,
  });

  data.push({
    year: 'Year 3',
    realistic: realistic.Projected_Revenue_Y3,
    optimistic: optimistic.Projected_Revenue_Y3,
    pessimistic: pessimistic.Projected_Revenue_Y3,
    enterprise: adjustedValuation?.enterpriseY3 ?? 0,
    equity: adjustedValuation?.equityY3 ?? 0,
    debt: debtY2,
    isHistory: false,
  });

  return data;
};

export const computeYDomain = (chartData: Array<Record<string, any>>, viewMode: ViewMode) => {
  if (chartData.length === 0) return [0, 'auto'] as [number, string];

  const values =
    viewMode === 'revenue'
      ? chartData.flatMap((d) => [d.optimistic, d.realistic, d.pessimistic])
      : chartData.map((d) => d.enterprise);

  const validValues = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  const dataMin = Math.min(...validValues, 0);
  const dataMax = Math.max(...validValues);
  const range = dataMax - dataMin;
  const padding = Math.max(range * 0.1, dataMax * 0.05);

  return [Math.max(0, dataMin - padding), dataMax + padding] as [number, number];
};
