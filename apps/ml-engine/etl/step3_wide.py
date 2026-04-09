import logging
import numpy as np
import pandas as pd
from config import (OUT_DIR, REVENUE_MAX, ASSETS_MAX,
                    TAGS_BS, TAGS_IS, TAGS_CF,
                    TAG_TO_CANONICAL, ALIAS_PRIORITY)

log = logging.getLogger(__name__)

def build_wide(num_filtered: pd.DataFrame, sub_10k: pd.DataFrame) -> pd.DataFrame:
    cache = OUT_DIR / "wide.parquet"
    if cache.exists():
        log.info("✅ wide cached")
        return pd.read_parquet(cache)

    log.info("🔗 Pivoting to wide format...")
    num = num_filtered.merge(
        sub_10k[["adsh", "cik", "name", "filed", "year",
                 "sic_num", "stprba", "country", "filing_lag_days"]],
        on="adsh", how="inner",
    )

    num["tag_canonical"]  = num["tag"].map(TAG_TO_CANONICAL)
    num["alias_priority"] = num["tag"].map(ALIAS_PRIORITY).fillna(99)
    num["ddate"]          = pd.to_numeric(num["ddate"], errors="coerce")
    
    # Résolution des conflits d'alias : on garde le tag avec la plus haute priorité
    num = (num.sort_values(["alias_priority", "ddate"])
              .drop_duplicates(["adsh", "tag_canonical"], keep="last"))

    wide = num.pivot_table(
        index=["cik", "adsh", "year", "filed", "name",
               "sic_num", "stprba", "country", "filing_lag_days"],
        columns="tag_canonical", values="value", aggfunc="last",
    ).reset_index()
    wide.columns.name = None

    # Initialisation des colonnes manquantes pour garantir la stabilité matricielle
    for col in list(TAGS_BS) + list(TAGS_IS) + list(TAGS_CF):
        if col not in wide.columns:
            wide[col] = np.nan

    # ── Calcul de la Dette Totale (Critique pour le modèle PME) ──
    wide["TotalDebt"] = (
        wide["LongTermDebt"].fillna(0) + 
        wide.get("DebtCurrent", pd.Series(0, index=wide.index)).fillna(0)
    )

    # Filtrage par taille (Focus PME / ETI)
    wide["Revenues"] = pd.to_numeric(wide["Revenues"], errors="coerce")
    wide["Assets"]   = pd.to_numeric(wide["Assets"],   errors="coerce")
    wide = wide[
        (wide["Revenues"].fillna(0) <= REVENUE_MAX) &
        (wide["Assets"] <= ASSETS_MAX)
    ].reset_index(drop=True)

    wide["biz_size"] = np.select(
        [wide["Revenues"].fillna(0) < 1e6, wide["Revenues"] < 250e6],
        ["Micro", "Small"], "Medium",
    )
    
    wide["sector"] = pd.cut(
        wide["sic_num"],
        bins=[0, 999, 1499, 1999, 3999, 4999, 5199, 5999, 7999, 8999],
        labels=["Agriculture", "Mining", "Construction", "Manufacturing",
                "Transport", "Wholesale", "Retail", "Services", "Health"],
    )

    log.info(f"   Shape: {wide.shape}")
    wide.to_parquet(cache, index=False)
    return wide