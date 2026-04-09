import logging
import warnings

warnings.filterwarnings("ignore")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)

from etl.step1_sub  import build_sub_10k, build_ticker_map
from etl.step2_num  import build_num_filtered
from etl.step3_wide import build_wide
from etl.step4_feat import build_features, build_macro
from etl.step5_tgt  import build_targets


def main():
    sub      = build_sub_10k()
    tickers  = build_ticker_map(sub)
    num      = build_num_filtered(set(sub["adsh"].unique()))
    wide     = build_wide(num, sub)
    features = build_features(wide)
    features = build_macro(features)
    final    = build_targets(features, tickers)
    return final


if __name__ == "__main__":
    df = main()
    print(f"\n✅ Done — {len(df):,} rows, {df.shape[1]} columns")
