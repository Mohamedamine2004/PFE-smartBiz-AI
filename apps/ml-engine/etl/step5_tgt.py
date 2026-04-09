import time
import logging
import numpy as np
import pandas as pd
import yfinance as yf
from tqdm import tqdm
from datetime import timedelta
from config import OUT_DIR, HORIZONS, DENOM_FLOOR, YF_BATCH

log = logging.getLogger(__name__)

def _safe_market_cap(prices, date, shares) -> float:
    """
    Extracts the nearest stock price within a 7-day window and calculates Market Cap.
    """
    try:
        if prices is None or prices.empty or pd.isna(shares) or shares <= 0:
            return np.nan
            
        nearby = prices[
            (prices.index >= date - timedelta(days=7)) &
            (prices.index <= date + timedelta(days=7))
        ]
        
        if nearby.empty:
            return np.nan
            
        # Market Cap = Price * Shares Outstanding
        return float(nearby.iloc[-1]) * float(shares)
    except Exception:
        return np.nan

def build_targets(df: pd.DataFrame, ticker_map: pd.DataFrame) -> pd.DataFrame:
    cache = OUT_DIR / "final_multiples.parquet"
    if cache.exists():
        log.info("final_multiples cached")
        return pd.read_parquet(cache)

    log.info("Computing multi-horizon Valuation Multiples...")
    df = df.merge(ticker_map, on="cik", how="left")
    
    for lbl, days in HORIZONS.items():
        df[f"date_{lbl}"] = df["filed"] + pd.Timedelta(days=days)

    today   = pd.Timestamp.today().normalize()
    tickers = sorted(df["ticker"].dropna().unique().tolist())
    
    g_start = (df["filed"].min() - timedelta(days=10)).strftime("%Y-%m-%d")
    g_end   = min(
        df[[f"date_{l}" for l in HORIZONS]].max().max() + timedelta(days=10),
        today + timedelta(days=1),
    ).strftime("%Y-%m-%d")

    log.info(f"Downloading data for {len(tickers):,} tickers | range: {g_start} to {g_end}")

    # Batched Yahoo Finance Download
    price_cache = {}
    for i in tqdm(range(0, len(tickers), YF_BATCH), desc="Download"):
        batch = tickers[i : i + YF_BATCH]
        try:
            hist = yf.download(
                batch, start=g_start, end=g_end,
                auto_adjust=True, progress=False, threads=True,
            )
            if hist.empty:
                continue
                
            close = hist["Close"] if isinstance(hist.columns, pd.MultiIndex) else hist
            for tk in batch:
                if tk in close.columns:
                    s = close[tk].dropna()
                    if not s.empty:
                        price_cache[tk] = s
            time.sleep(0.3)
        except Exception:
            continue

    log.info(f"Price cache populated: {len(price_cache):,} tickers")

    # Compute Enterprise Value and Targets per row
    ev_fut = {lbl: [] for lbl in HORIZONS}

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Calculating Multiples"):
        tk         = row.get("ticker")
        total_debt = float(row.get("TotalDebt", 0) or 0)
        cash       = float(row.get("Cash", 0) or 0)
        shares     = float(row.get("SharesOutstanding", np.nan) or np.nan)
        prices     = price_cache.get(tk) if tk else None

        for lbl in HORIZONS:
            fd = row.get(f"date_{lbl}")
            
            if pd.isna(fd) or fd > today or prices is None or pd.isna(shares):
                ev_fut[lbl].append(np.nan)
                continue

            mc_future = _safe_market_cap(prices, fd, shares)
            
            if pd.isna(mc_future):
                ev_fut[lbl].append(np.nan)
            else:
                # EV = Market Cap + Total Debt - Cash
                ev = mc_future + total_debt - cash
                ev_fut[lbl].append(ev if ev > 0 else np.nan)

    df = df.copy()
    
    # ── MODIFICATION CRITIQUE : Application de limites économiques strictes ──
    for lbl, vals in ev_fut.items():
        df[f"EV_{lbl}"] = vals
        
        # Primary Target: EV / EBITDA
        safe_ebitda = df["EBITDA_proxy"].clip(lower=DENOM_FLOOR)
        raw_ebitda_mult = np.where(df["EBITDA_proxy"] > 0, df[f"EV_{lbl}"] / safe_ebitda, np.nan)
        
        # Secondary Target: EV / Revenues
        safe_rev = df["Revenues"].clip(lower=DENOM_FLOOR)
        raw_rev_mult = np.where(df["Revenues"] > 0, df[f"EV_{lbl}"] / safe_rev, np.nan)

        # Apply strict economic bounds (Winsorization by absolute limits, not percentiles)
        # Max EBITDA multiple: 50x (Extremely high growth limit)
        # Max Revenue multiple: 30x (SaaS peak valuations limit)
        df[f"Target_EV_EBITDA_{lbl}"] = pd.Series(raw_ebitda_mult).clip(lower=0.5, upper=50.0)
        df[f"Target_EV_Rev_{lbl}"] = pd.Series(raw_rev_mult).clip(lower=0.1, upper=30.0)

    # Drop columns that must not be exposed to the model
    columns_to_drop = [f"date_{l}" for l in HORIZONS] + ["SharesOutstanding", "ticker"]
    for lbl in HORIZONS:
        columns_to_drop.append(f"EV_{lbl}")
        
    df.drop(columns=columns_to_drop, inplace=True, errors="ignore")

    log.info(f"Final Dataset: {len(df):,} rows, {df.shape[1]} columns")
    df.to_parquet(cache, index=False)
    return df