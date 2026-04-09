import logging
import pandas as pd
from tqdm import tqdm
from config import (RAW_DIR, OUT_DIR,
                    ALL_TAGS, ALL_TAGS_BS, ALL_TAGS_IS, ALL_TAGS_CF, TAGS_BS)

log = logging.getLogger(__name__)

def build_num_filtered(adsh_valid: set) -> pd.DataFrame:
    cache = OUT_DIR / "num_filtered.parquet"
    if cache.exists():
        log.info("✅ num cached")
        return pd.read_parquet(cache)

    log.info("📂 Reading num.txt...")
    frames      = []
    shares_tags = set(TAGS_BS["SharesOutstanding"])

    for f in tqdm(sorted(RAW_DIR.glob("*/num.txt")), desc="num"):
        try:
            reader = pd.read_csv(
                f, sep="\t",
                usecols=["adsh", "tag", "ddate", "qtrs", "value", "uom"],
                dtype={"adsh": str, "tag": str, "uom": str},
                chunksize=500_000, low_memory=False,
            )
        except Exception:
            continue

        for chunk in reader:
            chunk = chunk[
                chunk["adsh"].isin(adsh_valid) & chunk["tag"].isin(ALL_TAGS)
            ]
            if chunk.empty:
                continue
            
            # Application stricte de la logique temporelle comptable
            # qtrs == 0 pour le Bilan (Snapshot)
            # qtrs == 4 pour le Compte de Résultat et Flux de Trésorerie (Cumul annuel)
            mask = (
                (chunk["tag"].isin(ALL_TAGS_BS - shares_tags) & (chunk["qtrs"] == 0)) |
                (chunk["tag"].isin(ALL_TAGS_IS) & (chunk["qtrs"] == 4)) |
                (chunk["tag"].isin(ALL_TAGS_CF) & (chunk["qtrs"] == 4)) |
                (chunk["tag"].isin(shares_tags) & (chunk["qtrs"] == 0))
            )
            
            chunk = chunk[mask & chunk["uom"].notna()]
            if not chunk.empty:
                frames.append(chunk)

    num = pd.concat(frames, ignore_index=True)
    log.info(f"   {len(num):,} rows extracted")
    num.to_parquet(cache, index=False)
    return num