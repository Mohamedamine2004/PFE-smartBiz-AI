import type {
  DashboardMetrics,
  FinancialValuation,
  ScenarioPrediction,
} from '../../types/dashboard';

export interface ManualProjectionData {
  scenarios: ScenarioPrediction[];
  valuation: FinancialValuation;
}

export const buildManualProjection = (
  historicalMetrics: DashboardMetrics | null,
): ManualProjectionData | null => {
  const currentRevenue = Number(
    historicalMetrics?.macroFeatures?.Revenues_N
      ?? historicalMetrics?.chartData?.[historicalMetrics.chartData.length - 1]?.revenue
      ?? 0,
  );

  if (!currentRevenue || currentRevenue <= 0) return null;

  const liabilities = Number(historicalMetrics?.macroFeatures?.Liabilities_N ?? 0);
  const assumedMultiple = 3.5;

  const buildScenario = (
    label: 'optimistic' | 'realistic' | 'pessimistic',
    y1: number,
    y2: number,
    y3: number,
  ): ScenarioPrediction => {
    const projectedY1 = currentRevenue * (1 + y1);
    const projectedY2 = projectedY1 * (1 + y2);
    const projectedY3 = projectedY2 * (1 + y3);

    return {
      label,
      Y1_CAGR: y1,
      Y2_CAGR: y2,
      Y3_CAGR: y3,
      Projected_Revenue_Y1: projectedY1,
      Projected_Revenue_Y2: projectedY2,
      Projected_Revenue_Y3: projectedY3,
    };
  };

  const optimistic = buildScenario('optimistic', 0.18, 0.15, 0.12);
  const realistic = buildScenario('realistic', 0.12, 0.1, 0.08);
  const pessimistic = buildScenario('pessimistic', 0.06, 0.05, 0.04);

  const enterpriseY1 = realistic.Projected_Revenue_Y1 * assumedMultiple;
  const enterpriseY2 = realistic.Projected_Revenue_Y2 * assumedMultiple;
  const enterpriseY3 = realistic.Projected_Revenue_Y3 * assumedMultiple;

  const valuation: FinancialValuation = {
    Current_Revenue: currentRevenue,
    Projected_Revenue_Y1: realistic.Projected_Revenue_Y1,
    Projected_Revenue_Y2: realistic.Projected_Revenue_Y2,
    Projected_Revenue_Y3: realistic.Projected_Revenue_Y3,
    Enterprise_Value_Y1: enterpriseY1,
    Enterprise_Value_Y2: enterpriseY2,
    Enterprise_Value_Y3: enterpriseY3,
    Equity_Value_Y1: enterpriseY1 - liabilities,
    Equity_Value_Y2: enterpriseY2 - liabilities,
    Equity_Value_Y3: enterpriseY3 - liabilities,
  };

  return {
    scenarios: [optimistic, realistic, pessimistic],
    valuation,
  };
};
