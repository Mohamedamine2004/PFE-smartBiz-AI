import os
import json
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

class PredictionEngine:
    def __init__(self):
        self.models = {}
        self.clip_bounds = {}
        self.model_error = {}
        self.feature_importance = {}
        self.denom_floor = 1000.0
        
        self.sector_benchmarks = {
            "1": {"Rev_Mom": 0.05, "AssetTurn": 0.60, "Op_Margin": 0.08, "CF_Margin": 0.10}, 
            "2": {"Rev_Mom": 0.06, "AssetTurn": 0.80, "Op_Margin": 0.06, "CF_Margin": 0.07}, 
            "3": {"Rev_Mom": 0.06, "AssetTurn": 0.80, "Op_Margin": 0.06, "CF_Margin": 0.07}, 
            "4": {"Rev_Mom": 0.04, "AssetTurn": 0.50, "Op_Margin": 0.12, "CF_Margin": 0.15}, 
            "5": {"Rev_Mom": 0.07, "AssetTurn": 1.50, "Op_Margin": 0.03, "CF_Margin": 0.04}, 
            "7": {"Rev_Mom": 0.10, "AssetTurn": 0.90, "Op_Margin": 0.05, "CF_Margin": 0.08}, 
            "8": {"Rev_Mom": 0.08, "AssetTurn": 0.85, "Op_Margin": 0.05, "CF_Margin": 0.08}, 
            "default": {"Rev_Mom": 0.06, "AssetTurn": 0.85, "Op_Margin": 0.05, "CF_Margin": 0.08}
        }
        
        self.ev_multiples = {
            "1": 1.5, "2": 2.0, "3": 2.0, "5": 0.8, "7": 4.5, "8": 4.0, "default": 2.0
        }
        
        self._load_assets()

    def _load_assets(self):
        missing_assets = []
        for h in [1, 2, 3]:
            model_path = f"model_Y{h}.cbm"
            bounds_path = f"clip_bounds_Y{h}.json"
            
            if os.path.exists(model_path):
                model = CatBoostRegressor()
                model.load_model(model_path)
                self.models[h] = model
            else:
                missing_assets.append(model_path)
                
            if os.path.exists(bounds_path):
                with open(bounds_path, "r") as f:
                    self.clip_bounds[h] = json.load(f)
            else:
                missing_assets.append(bounds_path)

        if missing_assets:
            raise RuntimeError(f"CRITICAL STARTUP ERROR: Missing required assets: {missing_assets}")

        # Load historical model error metrics
        error_path = "model_error.json"
        if os.path.exists(error_path):
            with open(error_path, "r") as f:
                self.model_error = json.load(f)
        else:
            # Fallback defaults from last known audit
            self.model_error = {
                "Y1": {"mae": 0.1647, "directional_accuracy": 0.69, "feature_importance": {}},
                "Y2": {"mae": 0.1506, "directional_accuracy": 0.738, "feature_importance": {}},
                "Y3": {"mae": 0.1216, "directional_accuracy": 0.791, "feature_importance": {}},
            }

        # Extract feature importance from models (live, always current)
        for h in [1, 2, 3]:
            key = f"Y{h}"
            model = self.models[h]
            names = model.feature_names_
            importances = model.get_feature_importance()
            self.feature_importance[key] = [
                {"feature": name, "importance": round(float(imp), 2)}
                for name, imp in sorted(zip(names, importances), key=lambda x: -x[1])
            ]

    def safe_div(self, num, denom):
        return num / max(abs(denom), self.denom_floor)

    def pseudo_rank(self, val, benchmark):
        diff = val - benchmark
        rank = 1 / (1 + np.exp(-10 * diff))
        return np.clip(rank, 0.01, 0.99)

    def _apply_bounds(self, df: pd.DataFrame, h: int):
        if h not in self.clip_bounds: 
            return df
        bounds = self.clip_bounds[h]
        for feat, limits in bounds.items():
            if feat in df.columns and feat != "sic1":
                low = min([v[0] for v in limits.values()])
                high = max([v[1] for v in limits.values()])
                df[feat] = df[feat].clip(lower=low, upper=high)
        return df

    def _build_scenarios(self, pred_y1, pred_y2, pred_y3, current_revenue):
        """Build optimistic / realistic / pessimistic scenarios using historical MAE."""
        mae_y1 = self.model_error.get("Y1", {}).get("mae", 0.15)
        mae_y2 = self.model_error.get("Y2", {}).get("mae", 0.15)
        mae_y3 = self.model_error.get("Y3", {}).get("mae", 0.12)

        scenarios = []
        for label, sign in [("optimistic", 1), ("realistic", 0), ("pessimistic", -1)]:
            y1 = pred_y1 + sign * mae_y1
            y2 = pred_y2 + sign * mae_y2
            y3 = pred_y3 + sign * mae_y3

            rev_y1 = current_revenue * (1 + y1)
            rev_y2 = rev_y1 * (1 + y2)
            rev_y3 = rev_y2 * (1 + y3)

            scenarios.append({
                "label": label,
                "Y1_CAGR": float(y1),
                "Y2_CAGR": float(y2),
                "Y3_CAGR": float(y3),
                "Projected_Revenue_Y1": float(rev_y1),
                "Projected_Revenue_Y2": float(rev_y2),
                "Projected_Revenue_Y3": float(rev_y3),
            })

        return scenarios

    def _build_confidence(self, pred_y1, pred_y2, pred_y3):
        """Build confidence bands per horizon using historical MAE."""
        result = {}
        for key, pred in [("Y1", pred_y1), ("Y2", pred_y2), ("Y3", pred_y3)]:
            err = self.model_error.get(key, {})
            mae = err.get("mae", 0.15)
            result[key] = {
                "mae": mae,
                "band_low": float(pred - mae),
                "band_high": float(pred + mae),
                "directional_accuracy": err.get("directional_accuracy", 0.7),
            }
        return result

    def predict_and_valuate(self, financials_list: list):
        predictions_out = []
        valuations_out = []
        scenarios_out = []
        
        for data in financials_list:
            sic1 = data.sic[:1]
            
            feats = {
                "sic1": sic1,
                "LeverageRatio": self.safe_div(data.Liabilities, data.Assets),
                "AssetTurnover": self.safe_div(data.Revenues, data.Assets),
                "OperatingMargin": self.safe_div(data.OperatingIncome, data.Revenues),
                "Assets_Momentum_1Y": self.safe_div((data.Assets - data.Assets_lag1), data.Assets_lag1),
                "Revenues_Momentum_1Y": self.safe_div((data.Revenues - data.Revenues_lag1), data.Revenues_lag1),
                "Liabilities_Momentum_1Y": self.safe_div((data.Liabilities - data.Liabilities_lag1), data.Liabilities_lag1),
                "CashFlow_to_Assets": self.safe_div(data.OperatingCashFlow, data.Assets),
                "Accruals": self.safe_div((data.NetIncomeLoss - data.OperatingCashFlow), data.Assets),
                "Revenues_Momentum_2Y": (self.safe_div(data.Revenues, data.Revenues_lag2)) ** 0.5 - 1
            }
            
            at_lag1 = self.safe_div(data.Revenues_lag1, data.Assets_lag1)
            feats["AssetTurnover_Momentum_1Y"] = self.safe_div((feats["AssetTurnover"] - at_lag1), at_lag1)
            m1_lag = self.safe_div((data.Revenues_lag1 - data.Revenues_lag2), data.Revenues_lag2)
            feats["Revenues_Accel"] = feats["Revenues_Momentum_1Y"] - m1_lag
            
            bench = self.sector_benchmarks.get(sic1, self.sector_benchmarks["default"])
            cf_margin = self.safe_div(data.OperatingCashFlow, data.Revenues)
            
            feats["Revenues_Momentum_1Y_Rank"] = self.pseudo_rank(feats["Revenues_Momentum_1Y"], bench["Rev_Mom"])
            feats["AssetTurnover_Rank"] = self.pseudo_rank(feats["AssetTurnover"], bench["AssetTurn"])
            feats["OperatingMargin_Rank"] = self.pseudo_rank(feats["OperatingMargin"], bench["Op_Margin"])
            feats["CashFlow_Margin_Rank"] = self.pseudo_rank(cf_margin, bench["CF_Margin"])

            df = pd.DataFrame([feats])
            df["sic1"] = df["sic1"].astype(str)
            
            features_y1 = self.models[1].feature_names_
            df_y1 = df[features_y1].copy() 
            df_y1 = self._apply_bounds(df_y1, 1)
            pred_y1 = np.clip(np.expm1(self.models[1].predict(df_y1)[0]), -0.99, 5.0)
            
            df_y2 = df.copy()
            df_y2["Pred_Y1"] = pred_y1
            features_y2 = self.models[2].feature_names_
            df_y2 = df_y2[features_y2].copy() 
            df_y2 = self._apply_bounds(df_y2, 2)
            pred_y2 = np.clip(np.expm1(self.models[2].predict(df_y2)[0]), -0.99, 5.0)
            
            df_y3 = df.copy()
            df_y3["Pred_Y1"] = pred_y1
            df_y3["Pred_Y2"] = pred_y2
            features_y3 = self.models[3].feature_names_
            df_y3 = df_y3[features_y3].copy()
            df_y3 = self._apply_bounds(df_y3, 3)
            pred_y3 = np.clip(np.expm1(self.models[3].predict(df_y3)[0]), -0.99, 5.0)

            predictions_out.append({
                "Y1_CAGR": float(pred_y1), 
                "Y2_CAGR": float(pred_y2), 
                "Y3_CAGR": float(pred_y3)
            })
            
            mult = self.ev_multiples.get(sic1, self.ev_multiples["default"])
            liability_margin = self.safe_div(data.Liabilities, data.Revenues)
            cash_margin = self.safe_div(data.CashAndEquivalents, data.Revenues)
            
            rev_y1 = data.Revenues * (1 + float(pred_y1))
            liab_y1 = rev_y1 * liability_margin
            ev_y1 = rev_y1 * mult
            eq_y1 = ev_y1 - liab_y1 + (rev_y1 * cash_margin)
            
            rev_y2 = rev_y1 * (1 + float(pred_y2))
            liab_y2 = rev_y2 * liability_margin
            ev_y2 = rev_y2 * mult
            eq_y2 = ev_y2 - liab_y2 + (rev_y2 * cash_margin)
            
            rev_y3 = rev_y2 * (1 + float(pred_y3))
            liab_y3 = rev_y3 * liability_margin
            ev_y3 = rev_y3 * mult
            eq_y3 = ev_y3 - liab_y3 + (rev_y3 * cash_margin)
            
            valuations_out.append({
                "Current_Revenue": data.Revenues,
                "Projected_Revenue_Y1": rev_y1,
                "Projected_Revenue_Y2": rev_y2,
                "Projected_Revenue_Y3": rev_y3,
                "Enterprise_Value_Y1": ev_y1,
                "Enterprise_Value_Y2": ev_y2,
                "Enterprise_Value_Y3": ev_y3,
                "Equity_Value_Y1": eq_y1,
                "Equity_Value_Y2": eq_y2,
                "Equity_Value_Y3": eq_y3
            })

            # Build scenarios for this company
            scenarios_out.append(
                self._build_scenarios(float(pred_y1), float(pred_y2), float(pred_y3), data.Revenues)
            )
        
        # Confidence is model-level (same for all companies)
        confidence_out = self._build_confidence(
            float(predictions_out[0]["Y1_CAGR"]) if predictions_out else 0,
            float(predictions_out[0]["Y2_CAGR"]) if predictions_out else 0,
            float(predictions_out[0]["Y3_CAGR"]) if predictions_out else 0,
        )

        return predictions_out, valuations_out, scenarios_out, confidence_out, self.feature_importance