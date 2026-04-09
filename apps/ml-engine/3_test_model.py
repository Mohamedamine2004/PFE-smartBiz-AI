import os
import json
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error

CATEGORICAL_FEATURES = ["sic1"]
ALWAYS_EXCLUDE       = {"cik", "name", "fy", "Revenues", "Liabilities", "sic"}
TARGET_CLIP_LOW      = -0.99
TARGET_CLIP_HIGH     =  5.00

def load_clip_bounds(h: int) -> dict:
    if os.path.exists(f"clip_bounds_Y{h}.json"):
        with open(f"clip_bounds_Y{h}.json") as fp: return json.load(fp)
    return {}

def cascade_predict(model, df: pd.DataFrame, features: list) -> np.ndarray:
    # Bulletproof categorical casting right before prediction
    for col in CATEGORICAL_FEATURES:
        if col in features and col in df.columns:
            df[col] = df[col].astype(str)
    
    return np.clip(np.expm1(model.predict(df[features])), TARGET_CLIP_LOW, TARGET_CLIP_HIGH)

def audit_models():
    os.makedirs("test", exist_ok=True)
    cat_models = {}
    error_summary = {}

    for h in [1, 2, 3]:
        dataset_file, model_file = f"dataset_Y{h}.csv", f"model_Y{h}.cbm"
        if not (os.path.exists(dataset_file) and os.path.exists(model_file)): continue

        df = pd.read_csv(dataset_file, low_memory=False)
        
        # Load the model
        cat_model = CatBoostRegressor()
        cat_model.load_model(model_file)
        cat_models[h] = cat_model
        
        # Get the EXACT features the model was trained on
        trained_features = cat_model.feature_names_
        target = f"Target_Growth_Y{h}"
        
        # Ensure categorical features are strings from the start
        for col in CATEGORICAL_FEATURES:
            if col in df.columns: 
                df[col] = df[col].astype(str)

        df = df.sort_values(["fy", "cik"])
        split_idx = int(len(df) * 0.85)
        train, test = df.iloc[:split_idx].copy(), df.iloc[split_idx:].copy()

        # Apply clipping bounds ONLY to numeric features
        clip_bounds = load_clip_bounds(h)
        for f in trained_features:
            if f not in CATEGORICAL_FEATURES and f in clip_bounds:
                for yr_str, (lo, hi) in clip_bounds[f].items():
                    m = test["fy"] == int(yr_str)
                    if m.any(): 
                        test.loc[m, f] = test.loc[m, f].clip(lo, hi)

        # Handle the Cascade
        if h > 1 and 1 in cat_models:
            features_y1 = cat_models[1].feature_names_
            for subset in [train, test]: 
                subset["Pred_Y1"] = cascade_predict(cat_models[1], subset, features_y1)
            
        if h > 2 and 2 in cat_models:
            features_y2 = cat_models[2].feature_names_
            for subset in [train, test]: 
                subset["Pred_Y2"] = cascade_predict(cat_models[2], subset, features_y2)

        # Final prediction
        y_test_real = test[target].clip(TARGET_CLIP_LOW, TARGET_CLIP_HIGH)
        
        # Make one final cast just to be absolutely certain
        for col in CATEGORICAL_FEATURES:
            if col in test.columns: 
                test[col] = test[col].astype(str)
                
        preds_real  = np.expm1(cat_model.predict(test[trained_features]))

        # Calculate metrics
        mae_real = mean_absolute_error(y_test_real, preds_real)
        dir_acc  = np.mean(np.sign(preds_real) == np.sign(y_test_real)) * 100
        
        importance = pd.DataFrame({"Feature": trained_features, "Imp": cat_model.get_feature_importance()}).sort_values("Imp", ascending=False)
        
        report = f"SMARTBIZ AI - PURE CATBOOST AUDIT (Y{h})\n{'='*50}\n"
        report += f"Rows: {len(test)} | Target Mean: {train[target].mean():.4f}\n"
        report += f"Real-Space MAE   : {mae_real*100:.2f}%\n"
        report += f"Directional Acc  : {dir_acc:.1f}%\n\nFEATURE IMPORTANCE\n{'-'*50}\n"
        for _, row in importance.iterrows():
            report += f"{row['Feature']:<30} : {row['Imp']:>5.2f}%\n"

        with open(f"test/Detailed_Audit_Y{h}.txt", "w", encoding="utf-8") as f: f.write(report)
        print(f"[SUCCESS] Y{h} Audit: MAE {mae_real*100:.2f}% | DirAcc {dir_acc:.1f}%")

        # Collect metrics for model_error.json
        error_summary[f"Y{h}"] = {
            "mae": round(float(mae_real), 4),
            "directional_accuracy": round(float(dir_acc / 100), 3),
            "feature_importance": {
                row["Feature"]: round(float(row["Imp"]), 2)
                for _, row in importance.iterrows()
            }
        }

    # ── After all horizons, write model_error.json ──────────────────────
    if error_summary:
        error_path = os.path.join(os.path.dirname(__file__), "model_error.json")
        with open(error_path, "w", encoding="utf-8") as fp:
            json.dump(error_summary, fp, indent=2)
        print(f"[SUCCESS] model_error.json written with {list(error_summary.keys())}")


if __name__ == "__main__":
    audit_models()