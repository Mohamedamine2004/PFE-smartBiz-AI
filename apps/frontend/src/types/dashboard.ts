/**
 * Shared types for the Dashboard feature.
 * Single source of truth — used by Dashboard.tsx, KpiCardGrid, charts, etc.
 */

export interface StrategicKpis {
  cac: number | null;
  ltv: number | null;
  tam: number | null;
  marketShare: number | null;
  employeeCount: number | null;
}

export interface ChartDataPoint {
  period: string;
  [metric: string]: string | number;
}

/** Valuation_Annual macro features stored in ImportBatch.macroFeatures */
export interface MacroFeatures {
  Assets_N?: number;
  Assets_N_1?: number;
  Liabilities_N?: number;
  Liabilities_N_1?: number;
  Revenues_N?: number;
  Revenues_N_1?: number;
  Revenues_N_2?: number;
  NetIncome_N?: number;
  OperatingIncome_N?: number;
  OperatingCashFlow_N?: number;
  CashAndEquivalents_N?: number;
  sic_code?: number;
}

/** Growth prediction (CAGR) for each horizon */
export interface GrowthPrediction {
  Y1_CAGR: number;
  Y2_CAGR: number;
  Y3_CAGR: number;
}

/** Financial valuation output from ML engine */
export interface FinancialValuation {
  Current_Revenue: number;
  Projected_Revenue_Y1: number;
  Projected_Revenue_Y2: number;
  Projected_Revenue_Y3: number;
  Enterprise_Value_Y1: number;
  Enterprise_Value_Y2: number;
  Enterprise_Value_Y3: number;
  Equity_Value_Y1: number;
  Equity_Value_Y2: number;
  Equity_Value_Y3: number;
}

// ── ML Enrichment types ─────────────────────────────────────────────

/** A single scenario projection (optimistic / realistic / pessimistic) */
export interface ScenarioPrediction {
  label: 'optimistic' | 'realistic' | 'pessimistic';
  Y1_CAGR: number;
  Y2_CAGR: number;
  Y3_CAGR: number;
  Projected_Revenue_Y1: number;
  Projected_Revenue_Y2: number;
  Projected_Revenue_Y3: number;
}

/** Confidence metrics for a single forecast horizon */
export interface ConfidenceBand {
  mae: number;
  band_low: number;
  band_high: number;
  directional_accuracy: number;
}

/** Confidence metrics keyed by horizon */
export interface ConfidenceMetrics {
  Y1: ConfidenceBand;
  Y2: ConfidenceBand;
  Y3: ConfidenceBand;
}

/** A single feature importance entry */
export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

/** ML Prediction result from GET /prediction/latest */
export interface PredictionResult {
  hasPrediction: boolean;
  predictionId?: string;
  createdAt?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string | null;
  model_version?: string;
  predictions?: GrowthPrediction[];
  valuations?: FinancialValuation[];
  scenarios?: ScenarioPrediction[][];
  confidence?: ConfidenceMetrics;
  feature_importance?: Record<string, FeatureImportanceItem[]>;
}

/** ML Prediction run result from POST /prediction/run */
export interface PredictionRunResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    model_version: string;
    predictions: GrowthPrediction[];
    valuations: FinancialValuation[];
    scenarios: ScenarioPrediction[][];
    confidence: ConfidenceMetrics;
    feature_importance: Record<string, FeatureImportanceItem[]>;
  };
}

export interface DashboardMetrics {
  hasData?: boolean;
  batchId?: string;
  strategicKpis: StrategicKpis;
  chartData: ChartDataPoint[];
  macroFeatures: MacroFeatures | null;
  uploadedAt: string | null;
  importCount?: number;
}

export interface ImportBatch {
  id: string;
  createdAt: string;
  recordCount: number;
  strategicKpis: StrategicKpis;
}

/** Dashboard navigation tabs */
export type DashboardTab = 'financial' | 'operational' | 'strategic' | 'ml-projection';
