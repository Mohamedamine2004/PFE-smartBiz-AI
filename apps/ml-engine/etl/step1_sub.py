import logging
import requests
import pandas as pd
from tqdm import tqdm
from config import (RAW_DIR, OUT_DIR, YEAR_START, YEAR_END,
                    EXCLUDED_COUNTRIES, EXCLUDED_SIC)

log = logging.getLogger(__name__)

def build_sub_10k() -> pd.DataFrame:
    cache = OUT_DIR / "sub_10k.parquet"
    if cache.exists():
        log.info("✅ sub_10k cached")
        return pd.read_parquet(cache)

    log.info("📂 Reading sub.txt...")
    frames = []
    for f in tqdm(sorted(RAW_DIR.glob("*/sub.txt")), desc="sub"):
        try:
            df = pd.read_csv(
                f, sep="\t",
                usecols=["adsh", "cik", "name", "filed", "form",
                         "sic", "countryba", "stprba", "period"],
                dtype=str, low_memory=False,
            )
        except Exception:
            continue
            
        # Filtre sur les rapports annuels audités
        df = df[df["form"].isin(["10-K", "10-K405", "10-KSB", "10-KT"])]
        df["country"] = df["countryba"].fillna("US").str.upper().str.strip()
        df = df[~df["country"].isin(EXCLUDED_COUNTRIES)]
        frames.append(df)

    sub = pd.concat(frames, ignore_index=True)
    sub["filed"]  = pd.to_datetime(sub["filed"],  format="%Y%m%d", errors="coerce")
    sub["period"] = pd.to_datetime(sub["period"], format="%Y%m%d", errors="coerce")
    sub["year"]   = sub["filed"].dt.year
    sub["cik"]    = sub["cik"].str.strip().str.zfill(10)
    sub = sub[(sub["year"] >= YEAR_START) & (sub["year"] <= YEAR_END)]

    sub["filing_lag_days"] = (sub["filed"] - sub["period"]).dt.days
    sub = (sub.sort_values("filed")
              .drop_duplicates(["cik", "year"], keep="last")
              .reset_index(drop=True))

    sub["sic_num"] = pd.to_numeric(sub["sic"], errors="coerce")
    excl = pd.Series(False, index=sub.index)
    for lo, hi in EXCLUDED_SIC:
        excl |= (sub["sic_num"] >= lo) & (sub["sic_num"] <= hi)
        
    sub = sub[~excl].reset_index(drop=True)

    log.info(f"   {len(sub):,} filings, {sub['cik'].nunique():,} CIKs")
    sub.to_parquet(cache, index=False)
    return sub


def build_ticker_map(sub_10k: pd.DataFrame) -> pd.DataFrame:
    cache = OUT_DIR / "cik_ticker.parquet"
    if cache.exists():
        log.info("✅ ticker map cached")
        return pd.read_parquet(cache)

    log.info("🌐 Building CIK→Ticker map...")
    # L'API de la SEC exige un User-Agent valide
    headers = {"User-Agent": "SmartBizAI_Data_Pipeline contact@example.com"}
    frames  = []

    for url in [
        "https://www.sec.gov/files/company_tickers_exchange.json",
        "https://www.sec.gov/files/company_tickers.json",
    ]:
        try:
            r    = requests.get(url, headers=headers, timeout=30)
            r.raise_for_status()
            data = r.json()
            if "data" in data:
                tdf = pd.DataFrame(data["data"], columns=data["fields"])
            else:
                tdf = (pd.DataFrame.from_dict(data, orient="index")
                         .rename(columns={"cik_str": "cik"}))
            tdf["cik"]    = tdf["cik"].astype(str).str.zfill(10)
            tdf["ticker"] = tdf["ticker"].str.upper().str.strip()
            frames.append(tdf[["cik", "ticker"]])
        except Exception as e:
            log.warning(f"   {url} failed: {e}")

    all_t  = (pd.concat(frames, ignore_index=True)
                .dropna(subset=["ticker"])
                .drop_duplicates("cik", keep="first"))
                
    mapped = (sub_10k[["cik"]].drop_duplicates()
                               .merge(all_t, on="cik", how="inner")) # Utilisation de inner join pour exclure les CIK sans ticker (inutilisables pour l'entraînement)
                               
    log.info(f"   Matched: {mapped['ticker'].notna().sum():,} / {len(mapped):,}")
    mapped.to_parquet(cache, index=False)
    return mapped