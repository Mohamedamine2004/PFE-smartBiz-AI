from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional

class RawFinancials(BaseModel):
    sic: str = Field(..., description="4-digit SIC code")
    
    # Year 0 (Current)
    Assets: float
    Liabilities: float
    Revenues: float
    OperatingIncome: float
    OperatingCashFlow: float
    NetIncomeLoss: float
    
    # Year -1
    Assets_lag1: float
    Liabilities_lag1: float
    Revenues_lag1: float
    
    # Year -2
    Revenues_lag2: float
    
    # Valuation Data
    CashAndEquivalents: float = 0.0 

class PredictionRequest(BaseModel):
    companies: List[RawFinancials]

class GrowthPrediction(BaseModel):
    Y1_CAGR: float
    Y2_CAGR: float
    Y3_CAGR: float

class FinancialValuation(BaseModel):
    Current_Revenue: float
    
    Projected_Revenue_Y1: float
    Projected_Revenue_Y2: float
    Projected_Revenue_Y3: float
    
    Enterprise_Value_Y1: float
    Enterprise_Value_Y2: float
    Enterprise_Value_Y3: float
    
    Equity_Value_Y1: float
    Equity_Value_Y2: float
    Equity_Value_Y3: float

# ── New enrichment models ────────────────────────────────────────────

class ScenarioPrediction(BaseModel):
    """Revenue projections for a single scenario (optimistic / realistic / pessimistic)."""
    label: str
    Y1_CAGR: float
    Y2_CAGR: float
    Y3_CAGR: float
    Projected_Revenue_Y1: float
    Projected_Revenue_Y2: float
    Projected_Revenue_Y3: float

class ConfidenceHorizon(BaseModel):
    """Confidence metrics for a single forecast horizon."""
    mae: float
    band_low: float
    band_high: float
    directional_accuracy: float

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float

class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_version: str = "2.0-Cascade"
    predictions: List[GrowthPrediction]
    valuations: List[FinancialValuation]
    scenarios: List[List[ScenarioPrediction]]
    confidence: Dict[str, ConfidenceHorizon]
    feature_importance: Dict[str, List[FeatureImportanceItem]]