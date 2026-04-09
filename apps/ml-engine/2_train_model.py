import os
import json
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error
import optuna

optuna.logging.set_verbosity(optuna.logging.WARNING)

# Configuration optimisée : Uniquement sic1 en catégorique pour éviter l'overfitting
CATEGORICAL_FEATURES = ["sic1"]
ALWAYS_EXCLUDE       = {"cik", "name", "fy", "Revenues", "Liabilities", "sic"}
TARGET_CLIP_LOW      = -0.99
TARGET_CLIP_HIGH     =  5.00

def cascade_predict(model, df: pd.DataFrame, features: list) -> np.ndarray:
    preds_real = np.expm1(model.predict(df[features]))
    return np.clip(preds_real, TARGET_CLIP_LOW, TARGET_CLIP_HIGH)

def train_models():
    models_in_memory = {}
    for h in [1, 2, 3]:
        file_name = f"dataset_Y{h}.csv"
        if not os.path.exists(file_name): continue

        print(f"\n[INFO] Training CatBoost Model Y{h}...")
        df = pd.read_csv(file_name, low_memory=False)
        for col in CATEGORICAL_FEATURES:
            if col in df.columns: df[col] = df[col].astype(str)

        target     = f"Target_Growth_Y{h}"
        base_feats = [c for c in df.columns if c not in ALWAYS_EXCLUDE | {target}]

        df = df.sort_values(["fy", "cik"])
        split_idx = int(len(df) * 0.85)
        train, test = df.iloc[:split_idx].copy(), df.iloc[split_idx:].copy()

        current_features = list(base_feats)
        if h > 1 and 1 in models_in_memory:
            for subset in [train, test]: subset["Pred_Y1"] = cascade_predict(models_in_memory[1], subset, base_feats)
            current_features.append("Pred_Y1")
        if h > 2 and 2 in models_in_memory:
            for subset in [train, test]: subset["Pred_Y2"] = cascade_predict(models_in_memory[2], subset, current_features)
            current_features.append("Pred_Y2")

        y_train_log = np.log1p(train[target].clip(TARGET_CLIP_LOW, TARGET_CLIP_HIGH))
        X_train     = train[current_features]

        val_split = int(len(train) * 0.80)
        X_tr, X_val = X_train.iloc[:val_split], X_train.iloc[val_split:]
        y_tr, y_val = y_train_log.iloc[:val_split], y_train_log.iloc[val_split:]
        cat_idx = [f for f in CATEGORICAL_FEATURES if f in current_features]

        def objective(trial):
            params = dict(
                depth               = trial.suggest_int("depth", 3, 7),
                learning_rate       = trial.suggest_float("learning_rate", 0.01, 0.15, log=True),
                l2_leaf_reg         = trial.suggest_float("l2_leaf_reg", 1.0, 10.0),
                iterations          = trial.suggest_int("iterations", 300, 800),
                # FIX: Strictement MAE pour éviter le crash CatBoost (Metric Huber requires delta)
                loss_function       = "MAE", 
                # Paramètres de robustesse conservés
                bagging_temperature = trial.suggest_float("bagging_temperature", 0.0, 1.0),
                random_strength     = trial.suggest_float("random_strength", 0.0, 2.0),
                random_seed         = 42, 
                verbose             = False
            )
            
            m = CatBoostRegressor(**params, cat_features=cat_idx)
            m.fit(X_tr, y_tr, eval_set=(X_val, y_val), early_stopping_rounds=30)
            return mean_absolute_error(y_val, m.predict(X_val))

        study = optuna.create_study(direction="minimize")
        study.optimize(objective, n_trials=50, show_progress_bar=False)
        
        best = study.best_params
        
        # Injection des meilleurs paramètres complets dans le modèle final
        cat_model = CatBoostRegressor(
            **best, loss_function="MAE", random_seed=42, verbose=False, cat_features=cat_idx
        )
        cat_model.fit(X_train, y_train_log, eval_set=(X_val, y_val), early_stopping_rounds=40, use_best_model=True)
        cat_model.save_model(f"model_Y{h}.cbm")
        models_in_memory[h] = cat_model
        
        print(f"[SUCCESS] Model Y{h} saved. Best MAE on Val: {study.best_value:.4f}")

if __name__ == "__main__":
    train_models()