export const ValuationMethod = {
  EV_EBITDA: 'EV_EBITDA',
  EV_REVENUE: 'EV_REVENUE',
  PE_RATIO: 'PE_RATIO',
  ASSET_BASED: 'ASSET_BASED',
  GORDON_GROWTH: 'GORDON_GROWTH',
} as const;

export type ValuationMethod = (typeof ValuationMethod)[keyof typeof ValuationMethod];

export interface ValuationMethodInfo {
  id: ValuationMethod;
  name: string;
  formula: string;
  description: string;
  bestUseCase: string;
  requiredFields: string[];
}

export interface ValuationResult {
  method: ValuationMethod;
  enterpriseValue: number | null;
  equityValue: number;
  formula: string;
  explanation: string;
  inputs: Record<string, number>;
}

export interface ValuationInputs {
  method: ValuationMethod;
  ebitda?: number;
  multiple?: number;
  netDebt?: number;
  revenue?: number;
  netIncome?: number;
  peRatio?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  freeCashFlow?: number;
  growthRate?: number;
  wacc?: number;
}

export interface SavedValuation {
  id: string;
  method: string;
  inputs: Record<string, number>;
  enterpriseValue: number | null;
  equityValue: number;
  formula: string;
  explanation: string;
  label: string | null;
  createdAt: string;
}
