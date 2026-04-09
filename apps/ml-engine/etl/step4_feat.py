import logging
import numpy as np
import pandas as pd
from config import (OUT_DIR, DENOM_FLOOR,
                    TAGS_BS, TAGS_IS, TAGS_CF,
                    safe_div, clip_per_year)

log = logging.getLogger(__name__)

try:
    import pandas_datareader.data as web
    HAS_PDR = True
except ImportError:
    HAS_PDR = False

def build_features(wide: pd.DataFrame) -> pd.DataFrame:
    cache = OUT_DIR / "features.parquet"
    if cache.exists():
        log.info("✅ features cached")
        return pd.read_parquet(cache)

    log.info("🔬 Computing features...")
    df = wide.copy().sort_values(["cik", "year"]).reset_index(drop=True)
    yr = df["year"]
    cr = lambda s: clip_per_year(s, yr)

    # ── Profitability ──────────────────────────────────────────────
    df["ROA"]              = cr(safe_div(df["NetIncomeLoss"], df["Assets"]))
    df["ROE"]              = cr(safe_div(df["NetIncomeLoss"], df["StockholdersEquity"]))
    df["Profit_Margin"]    = cr(safe_div(df["NetIncomeLoss"], df["Revenues"]))
    df["Operating_Margin"] = cr(safe_div(df["OperatingIncome"], df["Revenues"]))
    df["Gross_Margin"]     = cr(safe_div(df["GrossProfit"], df["Revenues"]))
    df["EBITDA_proxy"]     = (df["OperatingIncome"].fillna(0) +
                              df["DepreciationAmortization"].fillna(0))
    df["EBITDA_Margin"]    = cr(safe_div(df["EBITDA_proxy"], df["Revenues"]))

    # ── Leverage (Utilisation de la TotalDebt) ─────────────────────
    df["Debt_Equity"]       = cr(safe_div(df["TotalDebt"], df["StockholdersEquity"].abs()))
    df["Debt_Assets"]       = cr(safe_div(df["TotalDebt"], df["Assets"]))
    df["Interest_Coverage"] = cr(safe_div(df["OperatingIncome"].fillna(0),
                                          df["InterestExpense"].fillna(0)))

    # ── Liquidity ──────────────────────────────────────────────────
    df["Current_Ratio"] = cr(safe_div(df["AssetsCurrent"], df["LiabilitiesCurrent"]))
    df["WC_to_Assets"]  = cr(safe_div(
        df["AssetsCurrent"] - df["LiabilitiesCurrent"].fillna(0), df["Assets"]
    ))

    # ── Efficiency & Cash Flow ─────────────────────────────────────
    df["Asset_Turnover"] = cr(safe_div(df["Revenues"], df["Assets"]))
    df["FCF"]            = (df["OperatingCashFlow"].fillna(0) -
                            df["CapitalExpenditure"].fillna(0).abs())
    df["FCF_Margin"]     = cr(safe_div(df["FCF"], df["Revenues"]))
    df["OCF_Margin"]     = cr(safe_div(df["OperatingCashFlow"], df["Revenues"]))

    df["Accrual_Quality"] = cr(safe_div(
        df["NetIncomeLoss"].fillna(0) - df["OperatingCashFlow"].fillna(0),
        df["Assets"],
    ))

    df["Log_Assets"]   = np.log1p(df["Assets"].clip(lower=0))
    df["Log_Revenues"] = np.log1p(df["Revenues"].clip(lower=0))

    # ── Private Health Score (Alternative au Piotroski) ────────────
    sector_debt_med = df.groupby(["sector", "year"])["Debt_Assets"].transform("median")
    
    df["Private_Health_Score"] = (
        (df["ROA"].fillna(0) > 0).astype(int) +
        (df["OperatingCashFlow"].fillna(0) > 0).astype(int) +
        (df["OperatingCashFlow"].fillna(0) > df["NetIncomeLoss"].fillna(0)).astype(int) +
        (df["Current_Ratio"].fillna(0) > 1.0).astype(int) +
        (df["Debt_Assets"].fillna(0) < sector_debt_med).astype(int)
    )

    # ── YoY momentum ───────────────────────────────────────────────
    yd2 = df.groupby("cik")["year"].diff()
    for col in ["Revenues", "Assets", "NetIncomeLoss", "ROA",
                "Profit_Margin", "Gross_Margin", "Debt_Assets", "FCF"]:
        if col not in df.columns:
            continue
        pv  = df.groupby("cik")[col].shift(1)
        raw = (df[col] - pv) / pv.abs().clip(lower=DENOM_FLOOR)
        
        # Explicitly cast the NumPy array to a Pandas Series and preserve the index
        yoy_series = pd.Series(np.where(yd2 == 1, raw, np.nan), index=df.index)
        
        # Pass the Series to the clipping function
        df[f"YoY_{col}"] = cr(yoy_series)

    # ── Sector-relative (Corrigé pour éviter le Data Leakage) ──────
    for col in ["ROA", "Profit_Margin", "Debt_Assets", "FCF_Margin"]:
        if col in df.columns:
            # On calcule la médiane sectorielle, et on la décale d'une année
            sector_yearly_med = df.groupby(["sector", "year"])[col].median().reset_index()
            sector_yearly_med["year"] += 1 
            sector_yearly_med.rename(columns={col: f"{col}_median_prev"}, inplace=True)
            
            df = df.merge(sector_yearly_med, on=["sector", "year"], how="left")
            df[f"{col}_vs_sector"] = df[col] - df[f"{col}_median_prev"]
            df.drop(columns=[f"{col}_median_prev"], inplace=True)

    # ── Nettoyage des features inutilisables en inférence ──────────
    df.drop(columns=["filing_lag_days", "late_filer"], errors="ignore", inplace=True)

    log.info(f"   {df.shape[1]} columns")
    df.to_parquet(cache, index=False)
    return df

def build_macro(df: pd.DataFrame) -> pd.DataFrame:
    cache = OUT_DIR / "macro.parquet"
    macro = None

    if cache.exists():
        macro = pd.read_parquet(cache)
    elif HAS_PDR:
        log.info("🌐 Downloading macro data (FRED)...")
        try:
            fed = web.DataReader("FEDFUNDS", "fred", "2014-01-01", "2026-06-01")
            fed.index   = pd.to_datetime(fed.index).to_period("M")
            fed.columns = ["fed_rate"]

            cpi = web.DataReader("CPIAUCSL", "fred", "2013-01-01", "2026-06-01")
            cpi["cpi_yoy"] = cpi["CPIAUCSL"].pct_change(12) * 100
            cpi = cpi[["cpi_yoy"]].dropna()
            cpi.index = pd.to_datetime(cpi.index).to_period("M")

            macro = fed.join(cpi, how="outer").reset_index()
            macro.columns = ["period", "fed_rate", "cpi_yoy"]
            macro.to_parquet(cache, index=False)
            log.info("   ✅ Macro saved")
        except Exception as e:
            log.warning(f"   FRED failed: {e}")
    else:
        log.warning("   pandas_datareader not installed — macro features = NaN")

    if macro is None:
        df["fed_rate"]    = np.nan
        df["cpi_yoy"]     = np.nan
        df["rate_regime"] = "LOW"
        return df

    df = df.copy()
    df["_p"]        = df["filed"].dt.to_period("M")
    macro["period"] = pd.PeriodIndex(macro["period"], freq="M")
    df = df.merge(macro.rename(columns={"period": "_p"}), on="_p", how="left")
    df.drop(columns=["_p"], inplace=True)

   # ── Assign as standard string array first ──
    df["rate_regime"] = np.select(
        [df["fed_rate"] < 0.5, df["fed_rate"] < 2.0, df["fed_rate"] >= 2.0],
        ["ZIRP", "LOW", "HIGH"], default="LOW"
    )
    df["rate_regime"] = df["rate_regime"].astype("category")
    
    return df
    