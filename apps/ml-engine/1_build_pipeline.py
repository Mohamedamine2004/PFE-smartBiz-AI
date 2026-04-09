import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR     = Path("sec_data_raw")
REVENUE_MAX = 1_000_000_000
ASSETS_MAX  = 2_000_000_000
DENOM_FLOOR = 1_000

EXCLUDED_COUNTRIES = {"IL", "ISR", "ISRAEL"}
EXCLUDED_SIC       = [(6000, 6999), (4900, 4999), (9000, 9999)]

TAG_TO_CANONICAL = {
    "Assets": "Assets", "TotalAssets": "Assets",
    "Liabilities": "Liabilities", "TotalLiabilities": "Liabilities",
    "StockholdersEquity": "StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest": "StockholdersEquity",
    "Revenues": "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax": "Revenues", "SalesRevenueNet": "Revenues",
    "NetIncomeLoss": "NetIncomeLoss", "ProfitLoss": "NetIncomeLoss",
    "OperatingIncomeLoss": "OperatingIncome",
    "NetCashProvidedByUsedInOperatingActivities": "OperatingCashFlow"
}

def safe_div(num, denom):
    return num / denom.abs().clip(lower=DENOM_FLOOR)

def compute_clip_bounds(s: pd.Series, year: pd.Series, lo: float = 0.01, hi: float = 0.99) -> dict:
    bounds = {}
    for yr in year.dropna().unique():
        m = year == yr
        sub = s[m]
        if sub.notna().sum() < 30: continue
        bounds[int(yr)] = (float(sub.quantile(lo)), float(sub.quantile(hi)))
    return bounds

def apply_clip_bounds(s: pd.Series, year: pd.Series, bounds: dict) -> pd.Series:
    result = s.copy()
    for yr_str, (lo_val, hi_val) in bounds.items():
        yr = int(yr_str)
        m = year == yr
        if m.any(): result.loc[m] = s[m].clip(lower=lo_val, upper=hi_val)
    return result

def is_valid_sic(sic_val: str) -> bool:
    try:
        s = int(sic_val)
        for lo, hi in EXCLUDED_SIC:
            if lo <= s <= hi: return False
        return True
    except Exception: return True

def build_pipeline():
    all_data = []
    print("[INFO] Phase 1: Extraction des données fondamentales et du Cash Flow...")

    for folder in sorted(os.listdir(RAW_DIR)):
        p = os.path.join(RAW_DIR, folder)
        if not os.path.isdir(p): continue
        sub_p, num_p = os.path.join(p, "sub.txt"), os.path.join(p, "num.txt")
        if not (os.path.exists(sub_p) and os.path.exists(num_p)): continue

        sub = pd.read_csv(sub_p, sep="\t", usecols=["adsh", "cik", "name", "sic", "countryba", "fy", "form"], low_memory=False)
        sub = sub[(sub["form"] == "10-K") & (~sub["countryba"].isin(EXCLUDED_COUNTRIES))]

        num = pd.concat([c[(c["tag"].isin(TAG_TO_CANONICAL.keys())) & (c["qtrs"].isin([0, 4]))] 
                         for c in pd.read_csv(num_p, sep="\t", usecols=["adsh", "tag", "value", "qtrs"], chunksize=500_000)])
        num["tag"] = num["tag"].map(TAG_TO_CANONICAL)
        
        m = pd.merge(sub, num, on="adsh").groupby(["cik", "name", "sic", "fy", "tag"])["value"].mean().reset_index()
        all_data.append(m)

    df_wide = pd.concat(all_data).pivot_table(index=["cik", "name", "sic", "fy"], columns="tag", values="value").reset_index()
    for col in set(TAG_TO_CANONICAL.values()):
        if col not in df_wide.columns: df_wide[col] = np.nan

    df_wide["sic"]  = df_wide["sic"].fillna(0).astype(int).astype(str).str.zfill(4)
    df_wide["sic2"] = df_wide["sic"].str[:2]
    df_wide["sic1"] = df_wide["sic"].str[:1]

    df_wide = df_wide[df_wide["sic"].apply(is_valid_sic)]
    df_wide = df_wide[(df_wide["Assets"] >= 1_000_000) & (df_wide["Assets"] <= ASSETS_MAX) & 
                      (df_wide["Revenues"] >= 100_000) & (df_wide["Revenues"] <= REVENUE_MAX)]
    
    df_wide["Liabilities"] = df_wide["Liabilities"].fillna(df_wide["Assets"] - df_wide["StockholdersEquity"])
    df_wide["OperatingIncome"] = df_wide["OperatingIncome"].fillna(df_wide["NetIncomeLoss"])
    df_wide["OperatingCashFlow"] = df_wide["OperatingCashFlow"].fillna(df_wide["NetIncomeLoss"]) 
    
    df_wide = df_wide.dropna(subset=["Assets", "Revenues", "Liabilities", "NetIncomeLoss"])

    print("[INFO] Phase 2: Feature Engineering (Ratios, Cash Flow & Vélocité)...")
    df_wide["LeverageRatio"]   = safe_div(df_wide["Liabilities"], df_wide["Assets"])
    df_wide["ROA"]             = safe_div(df_wide["NetIncomeLoss"], df_wide["Assets"])
    df_wide["AssetTurnover"]   = safe_div(df_wide["Revenues"], df_wide["Assets"])
    df_wide["OperatingMargin"] = safe_div(df_wide["OperatingIncome"], df_wide["Revenues"])

    df_wide["CashFlow_Margin"]    = safe_div(df_wide["OperatingCashFlow"], df_wide["Revenues"])
    df_wide["CashFlow_to_Assets"] = safe_div(df_wide["OperatingCashFlow"], df_wide["Assets"])
    df_wide["Accruals"] = safe_div((df_wide["NetIncomeLoss"] - df_wide["OperatingCashFlow"]), df_wide["Assets"])

    df_wide = df_wide.sort_values(["cik", "fy"])
    
    for feat in ["Revenues", "Assets", "Liabilities", "AssetTurnover"]:
        df_wide[f"{feat}_lag1"] = df_wide.groupby("cik")[feat].shift(1)
        df_wide[f"{feat}_Momentum_1Y"] = safe_div((df_wide[feat] - df_wide[f"{feat}_lag1"]), df_wide[f"{feat}_lag1"])

    df_wide["Revenues_lag2"] = df_wide.groupby("cik")["Revenues"].shift(2)
    df_wide["Revenues_Momentum_2Y"] = (safe_div(df_wide["Revenues"], df_wide["Revenues_lag2"].abs().clip(lower=DENOM_FLOOR))) ** 0.5 - 1
    
    m1_lag = df_wide.groupby("cik")["Revenues_Momentum_1Y"].shift(1)
    df_wide["Revenues_Accel"] = df_wide["Revenues_Momentum_1Y"] - m1_lag

    """print("[INFO] Phase 3: Normalisation Intra-Sectorielle (Cross-Sectional Z-Scoring)...")
    relative_metrics = ["Revenues_Momentum_1Y", "AssetTurnover", "OperatingMargin", "CashFlow_Margin"]
    for feat in relative_metrics:
        sector_median = df_wide.groupby(["sic1", "fy"])[feat].transform("median")
        df_wide[f"{feat}_Relative"] = df_wide[feat] - sector_median

    print("[INFO] Phase 4: Création de la Cible (Revenue Growth) et Export...")
    df_wide["Target_Value"] = df_wide["Revenues"]
    
    meta_cols = ["cik", "name", "sic", "fy", "Revenues", "Liabilities"]
    
    base_features = [
        "LeverageRatio", "ROA", "AssetTurnover", "OperatingMargin",
        "Assets_Momentum_1Y", "Revenues_Momentum_1Y", "AssetTurnover_Momentum_1Y", "Liabilities_Momentum_1Y",
        "CashFlow_Margin", "CashFlow_to_Assets", "Accruals",
        "Revenues_Momentum_1Y_Relative", "AssetTurnover_Relative", "OperatingMargin_Relative", "CashFlow_Margin_Relative",
        "Revenues_Momentum_2Y", "Revenues_Accel", 
        "sic2", "sic1"
    ]"""
    print("[INFO] Phase 3: Normalisation Intra-Sectorielle (Percentile Ranking)...")
    relative_metrics = ["Revenues_Momentum_1Y", "AssetTurnover", "OperatingMargin", "CashFlow_Margin"]
    
    # NOUVEAU : On utilise le Percentile Rank plutôt que la soustraction
    for feat in relative_metrics:
        df_wide[f"{feat}_Rank"] = df_wide.groupby(["sic1", "fy"])[feat].rank(pct=True)

    print("[INFO] Phase 4: Création de la Cible (Revenue Growth) et Export...")
    df_wide["Target_Value"] = df_wide["Revenues"]
    
    meta_cols = ["cik", "name", "sic", "fy", "Revenues", "Liabilities"]
    
    base_features = [
        "LeverageRatio", "AssetTurnover", "OperatingMargin",
        "Assets_Momentum_1Y", "Revenues_Momentum_1Y", "AssetTurnover_Momentum_1Y", "Liabilities_Momentum_1Y",
        "CashFlow_to_Assets", "Accruals",
        # NOUVEAU : Les variables s'appellent maintenant _Rank
        "Revenues_Momentum_1Y_Rank", "AssetTurnover_Rank", "OperatingMargin_Rank", "CashFlow_Margin_Rank",
        "Revenues_Momentum_2Y", "Revenues_Accel", 
        "sic1"
    ]

    for h in [1, 2, 3]:
        target_col = f"Target_Growth_Y{h}"
        df_wide[target_col] = (df_wide.groupby("cik")["Target_Value"].shift(-h) / df_wide["Target_Value"]) ** (1 / h) - 1
        df_h = df_wide.dropna(subset=[target_col] + base_features).sort_values(["fy", "cik"]).copy()

        split_idx = int(len(df_h) * 0.85)
        train, test = df_h.iloc[:split_idx].copy(), df_h.iloc[split_idx:].copy()
        
        # RESTRICTION STRICTE (-50% à +100%)
        train = train[(train[target_col] >= -0.50) & (train[target_col] <= 1.0)]
        test = test[(test[target_col] >= -0.50) & (test[target_col] <= 1.0)]

        clip_bounds_all = {}
        for f in base_features:
            if f in ["sic2", "sic1"]: continue
            bounds = compute_clip_bounds(train[f], train["fy"])
            clip_bounds_all[f] = bounds
            train[f] = apply_clip_bounds(train[f], train["fy"], bounds)
            test[f]  = apply_clip_bounds(test[f],  test["fy"],  bounds)

        with open(f"clip_bounds_Y{h}.json", "w") as fp: json.dump(clip_bounds_all, fp)

        export_cols = meta_cols + base_features + [target_col]
        pd.concat([train[export_cols], test[export_cols]]).to_csv(f"dataset_Y{h}.csv", index=False)
        print(f"[SUCCESS] Y{h} Data: {len(train)} Train | {len(test)} Test | {len(base_features)} Features")

if __name__ == "__main__":
    build_pipeline()